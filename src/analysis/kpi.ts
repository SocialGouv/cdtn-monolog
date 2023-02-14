import { logger } from "@socialgouv/cdtn-logger";
import { IDataFrame, ISeries } from "data-forge";

import { queryAndWrite } from "../reader/logReader";
import { computeCompletionRateOfUrlTool } from "./kpi/computeCompletionRateOfUrlTool";
import { computeKpiRateVisitsOnCcPagesOnAllContribPages } from "./kpi/computeKpiRateVisitsOnCcPagesOnAllContribPages";
import { computeRateOfProcessedCcResultsOverAllResultsByTools } from "./kpi/computeRateOfProcessedCcResultsOverAllResultsByTools";
import { getRateOfSuccessfulSearchWhenLookingForACc } from "./kpi/getRateOfSuccessfulSearchWhenLookingForACc";
import { removeAnchor } from "./popularity";
import { KpiReport } from "./reports";

const generateQueryToGetLogsForAGivenDate = (day: string) => {
  return {
    bool: {
      must: [
        {
          match: { logfile: day },
        },
      ],
    },
  };
};

export const readDaysAndWriteAllLogs = async (
  index: string,
  days: string[],
  outputFolderName: string
): Promise<void> => {
  const queries = days.map((day) => generateQueryToGetLogsForAGivenDate(day));
  const queries_and_days = queries.map((q, i) => ({
    day: days[i],
    query: q,
  }));

  await Promise.all(
    queries_and_days.map((query_days) => queryAndWrite(index, query_days.day, query_days.query, outputFolderName, []))
  );
  return;
};

const getFirstDayOfMonth = (series: ISeries): Date => {
  const last_day = new Date(series.toArray().sort().pop());
  last_day.setTime(last_day.getTime() + last_day.getTimezoneOffset() * 60 * 1000);
  return new Date(last_day.getFullYear(), last_day.getMonth(), 1, last_day.getHours());
};

export const filterDataframeByUrlWithPrefix = (dataset: IDataFrame, prefixUrl: string): IDataFrame => {
  return dataset.filter((log) => log.url != undefined && log.url.startsWith(prefixUrl));
};

export const removeAnchorFromUrl = (dataset: IDataFrame): IDataFrame => {
  return dataset.withSeries({
    url: (df) => df.deflate((row) => removeAnchor(row.url)),
  });
};

export const filterDataframeByToolAndRemoveAnchorFromUrl = (
  dataset: IDataFrame,
  url = "https://code.travail.gouv.fr/outils/"
): IDataFrame => {
  return filterDataframeByUrlWithPrefix(dataset, url).withSeries({
    url: (df) => df.deflate((row) => row.url).select((url) => removeAnchor(url)),
  });
};

export const filterDataframeByContribAndRemoveAnchorFromUrl = (
  dataset: IDataFrame,
  url = "https://code.travail.gouv.fr/contribution/"
): IDataFrame => {
  return filterDataframeByUrlWithPrefix(dataset, url).withSeries({
    url: (df) => df.deflate((row) => row.url).select((url) => removeAnchor(url)),
  });
};

export const dfDropDuplicatesOnUrlAndIdVisitAndType = (dataset: IDataFrame): IDataFrame => {
  return dataset.distinct((row) => [row.url, row.idVisit, row.type].join("_"));
};

export const countOccurrencesOfAGivenTypeInDf = (dataset: IDataFrame, type: string): number => {
  return dataset.where((row) => row.type == type).count();
};

export const getRateWith2decimalsGivenDenominatorAndNumerator = (denominator: number, numerator: number): number => {
  return denominator > 0 ? Math.round((numerator / denominator) * 10000) / 100 : 0;
};

export const formatKpiReport = (
  denominator: number,
  kpiType: string,
  numerator: number,
  reportId: string,
  startDate: Date,
  outil = ""
): KpiReport => {
  return {
    denominator: denominator,
    kpi_type: kpiType,
    numerator: numerator,
    outil: outil,
    rate: getRateWith2decimalsGivenDenominatorAndNumerator(denominator, numerator),
    reportId: reportId,
    reportType: "kpi",
    start_date: startDate,
  };
};

export const monthlyAnalysis = (logs: IDataFrame, reportId: string = new Date().getTime().toString()): KpiReport[] => {
  // Reindex dataframe because dataforge is terrible
  const newIndex = Array.from(Array(logs.count()).keys());
  const logsIndexed = logs.withIndex(newIndex);

  const startDate = getFirstDayOfMonth(logs.getSeries("lastActionDateTime"));

  logger.info("Computing completion rate for tools");
  const completionRateKpi = computeCompletionRateOfUrlTool(logsIndexed, startDate, reportId);
  logger.info("Computing the rate of personalized contrib with CC over all visits on page contrib");
  const rateVisitsOnCcPagesOnAllContribPages = computeKpiRateVisitsOnCcPagesOnAllContribPages(
    logsIndexed,
    startDate,
    reportId
  );
  logger.info("Computing the rate of personalized tool result with CC over all people attaining result page of tool");
  const rateOfCcResultsOverAllResultsOnTools = computeRateOfProcessedCcResultsOverAllResultsByTools(
    logsIndexed,
    startDate,
    reportId
  );
  logger.info("Computing the rate of successful search when looking for a CC");
  const rateOfSuccessfulSearchWhenLookingForACc = getRateOfSuccessfulSearchWhenLookingForACc(
    logsIndexed,
    startDate,
    reportId
  );

  return completionRateKpi.concat(
    rateVisitsOnCcPagesOnAllContribPages,
    rateOfCcResultsOverAllResultsOnTools,
    rateOfSuccessfulSearchWhenLookingForACc
  );
};
