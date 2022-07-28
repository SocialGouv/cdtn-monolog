import { IDataFrame, ISeries } from "data-forge";

import { queryAndWrite } from "../reader/logReader";
import { computeRateOfProcessedCcResultsOverAllResultsByTools } from "./kpi/computeRateOfProcessedCcResultsOverAllResultsByTools";
import { getRateOfSuccessfulSearchWhenLookingForACc } from "./kpi/getRateOfSuccessfulSearchWhenLookingForACc";
import { removeAnchor } from "./popularity";
import { KpiReport } from "./reports";
import { computeCompletionRateOfUrlTool } from "./kpi/computeCompletionRateOfUrlTool";

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
    queries_and_days.map((query_days) =>
      queryAndWrite(
        index,
        query_days.day,
        query_days.query,
        outputFolderName,
        []
      )
    )
  );
  return;
};

const getFirstDayOfMonth = (series: ISeries): Date => {
  const last_day = new Date(series.toArray().sort().pop());
  last_day.setTime(
    last_day.getTime() + last_day.getTimezoneOffset() * 60 * 1000
  );
  return new Date(
    last_day.getFullYear(),
    last_day.getMonth(),
    1,
    last_day.getHours()
  );
};

export const filterDataframeByUrlWithPrefix = (
  dataset: IDataFrame,
  prefixUrl: string
): IDataFrame => {
  return dataset.filter(
    (log) => log.url != undefined && log.url.startsWith(prefixUrl)
  );
};

export const filterDataframeByToolAndRemoveAnchorFromUrl = (
  dataset: IDataFrame,
  url = "https://code.travail.gouv.fr/outils/"
): IDataFrame => {
  return filterDataframeByUrlWithPrefix(dataset, url).withSeries({
    url: (df) =>
      df.deflate((row) => row.url).select((url) => removeAnchor(url)),
  });
};

export const filterDataframeByContribAndRemoveAnchorFromUrl = (
  dataset: IDataFrame,
  url = "https://code.travail.gouv.fr/contribution/"
): IDataFrame => {
  return filterDataframeByUrlWithPrefix(dataset, url).withSeries({
    url: (df) =>
      df.deflate((row) => row.url).select((url) => removeAnchor(url)),
  });
};

export const dfContribDropDuplicates = (dataset: IDataFrame): IDataFrame => {
  return dataset.distinct((row) => [row.url, row.idVisit, row.type].join("_"));
};

export const getVisitsOnContribWithoutIdcc = (
  dataset: IDataFrame
): IDataFrame => {
  return dataset.filter((log) =>
    /^https:\/\/code.travail.gouv.fr\/contribution\/[a-zA-Z]+/.test(log.url)
  );
};

export const getVisitsOnContribWithIdcc = (dataset: IDataFrame): IDataFrame => {
  return dataset.filter((log) =>
    /^https:\/\/code.travail.gouv.fr\/contribution\/[0-9]+/.test(log.url)
  );
};

export const countOccurrencesOfAGivenTypeInDf = (
  dataset: IDataFrame,
  type: string
): number => {
  return dataset.where((row) => row.type == type).count();
};

export const computeRateOfCcSelectOverVisitsOnContribWithoutIdcc = (
  dataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  const logsOnContribWithoutIdcc = getVisitsOnContribWithoutIdcc(dataset);
  const nbTotalVisitsOnContribWithoutIdcc = countOccurrencesOfAGivenTypeInDf(
    logsOnContribWithoutIdcc,
    "visit_content"
  );
  const nbCcSelectOnContribWithoutIdcc = countOccurrencesOfAGivenTypeInDf(
    logsOnContribWithoutIdcc,
    "cc_select"
  );

  return {
    denominator: nbTotalVisitsOnContribWithoutIdcc,
    kpi_type: "Rate-of-cc-select-on-pages-contribution-without-idcc",
    numerator: nbCcSelectOnContribWithoutIdcc,
    outil: "pages-contribution",
    rate:
      nbTotalVisitsOnContribWithoutIdcc > 0
        ? Math.round(
            (nbCcSelectOnContribWithoutIdcc /
              nbTotalVisitsOnContribWithoutIdcc) *
              100000
          ) / 1000
        : 0,
    reportId: reportId,
    reportType: "kpi",
    start_date: startDate,
  };
};

export const computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib = (
  dataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  // Compute denominator
  const nbTotalVisitsOnContrib = countOccurrencesOfAGivenTypeInDf(
    dataset,
    "visit_content"
  );

  // Compute numerator (sum of the two subTotal following)
  const logsOnContribWithIdcc = getVisitsOnContribWithIdcc(dataset);
  const nbTotalVisitsOnContribWithIdcc = countOccurrencesOfAGivenTypeInDf(
    logsOnContribWithIdcc,
    "visit_content"
  );
  const nbCcSelectOnContrib = countOccurrencesOfAGivenTypeInDf(
    dataset,
    "cc_select"
  );
  const numerator = nbCcSelectOnContrib + nbTotalVisitsOnContribWithIdcc;
  return {
    denominator: nbTotalVisitsOnContrib,
    kpi_type:
      "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
    numerator: numerator,
    outil: "pages-contribution",
    rate:
      nbTotalVisitsOnContrib > 0
        ? Math.round((numerator / nbTotalVisitsOnContrib) * 100000) / 1000
        : 0,
    reportId: reportId,
    reportType: "kpi",
    start_date: startDate,
  };
};

export const computeKpiRateVisitsOnCcPagesOnAllContribPages = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  // Get logs on pages contribution without duplicates in triple (url, idVisit, type)
  const logsOnContrib = filterDataframeByContribAndRemoveAnchorFromUrl(logs);
  const logsOnContribWithoutDuplicates = dfContribDropDuplicates(logsOnContrib);

  // KPI Rate of persons selecting a cc in non-personalized contribution pages
  const rateOfCcSelectOverVisitsOnContribWithoutIdcc =
    computeRateOfCcSelectOverVisitsOnContribWithoutIdcc(
      logsOnContribWithoutDuplicates,
      startDate,
      reportId
    );

  // KPI Rate of persons getting a personalized pages in all contribution pages
  const rateOfCcSelectAndNbCcPagesOverVisitsOnContrib =
    computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib(
      logsOnContribWithoutDuplicates,
      startDate,
      reportId
    );

  return [
    rateOfCcSelectOverVisitsOnContribWithoutIdcc,
    rateOfCcSelectAndNbCcPagesOverVisitsOnContrib,
  ];
};

export const monthlyAnalysis = (
  logs: IDataFrame,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  // Reindex dataframe because dataforge is terrible
  const newIndex = Array.from(Array(logs.count()).keys());
  const logsIndexed = logs.withIndex(newIndex);

  const startDate = getFirstDayOfMonth(logs.getSeries("lastActionDateTime"));

  const completionRateKpi = computeCompletionRateOfUrlTool(
    logsIndexed,
    startDate,
    reportId
  );
  const rateVisitsOnCcPagesOnAllContribPages =
    computeKpiRateVisitsOnCcPagesOnAllContribPages(
      logsIndexed,
      startDate,
      reportId
    );
  const rateOfCcResultsOverAllResultsOnTools =
    computeRateOfProcessedCcResultsOverAllResultsByTools(
      logsIndexed,
      startDate,
      reportId
    );

  return completionRateKpi.concat(
    rateVisitsOnCcPagesOnAllContribPages,
    rateOfCcResultsOverAllResultsOnTools
  );
};
