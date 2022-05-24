import { IDataFrame, ISeries } from "data-forge";

import { queryAndWrite } from "../reader/logReader";
import { removeAnchor } from "./popularity";
import { KpiReport } from "./reports";

const DICT_OF_OUTILS_WITH_STARTING_AND_ENDING_STEP_EVENT_NAME = {
  "Heures pour recherche d’emploi": {
    firstStep: "start",
    lastStep: "results",
  },
  "Indemnité de licenciement": {
    firstStep: "start",
    lastStep: "indemnite_legale",
  },
  "Indemnité de précarité": {
    firstStep: "start",
    lastStep: "indemnite",
  },
  "Préavis de démission": {
    firstStep: "start",
    lastStep: "results",
  },
  "Préavis de départ ou de mise à la retraite": {
    firstStep: "start",
    lastStep: "result",
  },
  "Préavis de licenciement": {
    firstStep: "start",
    lastStep: "results",
  },
};

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

const getValInDfIfIndexIsInList = (
  index: string,
  list: string[],
  df: IDataFrame<string, number>
): number => {
  return list.includes(index) ? df.getSeries("nbVisit").at(index) : 0;
};

export const getNumberOfVisitsByCcType = (
  logsOutilDataset: IDataFrame
): IDataFrame<string, number> => {
  return logsOutilDataset
    .groupBy((row) => [row.type])
    .select((group) => ({
      nbVisit: group
        .deflate((row) => row.idVisit)
        .distinct()
        .count(),
      type: group.first().type,
    }))
    .inflate()
    .setIndex("type")
    .dropSeries("type");
};

export const getConventionCollectiveCompletionRate = (
  logsOutilDataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  const logsConventionCollectiveDataset = logsOutilDataset.where(
    (log) =>
      log.url != undefined &&
      log.url.startsWith(
        "https://code.travail.gouv.fr/outils/convention-collective"
      )
  );

  const nbVisitsByCcType = getNumberOfVisitsByCcType(
    logsConventionCollectiveDataset
  );

  const ccTypes = nbVisitsByCcType.getIndex().toArray();

  const denominator =
    getValInDfIfIndexIsInList("cc_search", ccTypes, nbVisitsByCcType) +
    getValInDfIfIndexIsInList("enterprise_search", ccTypes, nbVisitsByCcType);
  const numerator =
    getValInDfIfIndexIsInList("cc_select_p1", ccTypes, nbVisitsByCcType) +
    getValInDfIfIndexIsInList("cc_select_p2", ccTypes, nbVisitsByCcType);

  return {
    denominator: denominator,
    kpi_type: "Completion-rate-of-tools",
    numerator: numerator,
    outil: "Trouver sa convention collective",
    rate: denominator > 0 ? numerator / denominator : 0,
    reportId: reportId,
    reportType: "kpi",
    start_date: startDate,
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getNumberOfVisitsByOutilAndEvent = (dataset: IDataFrame) => {
  return dataset
    .groupBy((row) => [row.outil, row.outilEvent])
    .select((group) => ({
      nbVisit: group
        .deflate((row) => row.idVisit)
        .distinct()
        .count(),
      outil: group.first().outil,
      outilEvent: group.first().outilEvent,
    }))
    .inflate();
};

export const getNbVisitIfStepDefinedInTool = (
  outil: string,
  eventStep: string | undefined,
  dataset: IDataFrame
): number => {
  if (eventStep != undefined) {
    const datasetFiltered = dataset.where(
      (row) => row.outil === outil && row.outilEvent === eventStep
    );
    if (datasetFiltered.count() > 0) {
      return datasetFiltered.first().nbVisit;
    }
  }
  return 0;
};

export const getListOfKpiCompletionRate = (
  visitsByUrlAndEvent: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport[] => {
  return Object.entries(
    DICT_OF_OUTILS_WITH_STARTING_AND_ENDING_STEP_EVENT_NAME
  ).map(([key, value]) => {
    const numerator = getNbVisitIfStepDefinedInTool(
      key,
      value.lastStep,
      visitsByUrlAndEvent
    );
    const denominator = getNbVisitIfStepDefinedInTool(
      key,
      value.firstStep,
      visitsByUrlAndEvent
    );

    return {
      denominator: denominator,
      kpi_type: "Completion-rate-of-tools",
      numerator: numerator,
      outil: key,
      rate: denominator > 0 ? numerator / denominator : 0,
      reportId: reportId,
      reportType: "kpi",
      start_date: startDate,
    };
  });
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
  return dataset.where(
    (log) => log.url != undefined && log.url.startsWith(prefixUrl)
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const computeCompletionRateOfUrlTool = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  // Get logs on tools
  const logsOutil = filterDataframeByUrlWithPrefix(
    logs,
    "https://code.travail.gouv.fr/outils"
  );

  // Compute completion rate of convention collective tool first
  const conventionCollectiveCompletionRate =
    getConventionCollectiveCompletionRate(logsOutil, startDate, reportId);

  const logsOutilFiltered = logsOutil.where(
    (row) => row.outilAction == "view_step"
  );

  const visitsByUrlAndEvent =
    getNumberOfVisitsByOutilAndEvent(logsOutilFiltered);

  const listOfKpisCompletionRate = getListOfKpiCompletionRate(
    visitsByUrlAndEvent,
    startDate,
    reportId
  );

  listOfKpisCompletionRate.push(conventionCollectiveCompletionRate);

  return listOfKpisCompletionRate;
};

export const filterDataframeByContrib = (dataset: IDataFrame): IDataFrame => {
  return filterDataframeByUrlWithPrefix(
    dataset,
    "https://code.travail.gouv.fr/contribution/"
  ).withSeries({
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
  const logsOnContrib = filterDataframeByContrib(logs);
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

  const completionRateKpi = computeCompletionRateOfUrlTool(logsIndexed, startDate, reportId);
  const rateVisitsOnCCPagesOnAllContribPages = computeKpiRateVisitsOnCcPagesOnAllContribPages(logsIndexed, startDate, reportId);

  return completionRateKpi.concat(rateVisitsOnCCPagesOnAllContribPages);
};
