import { IDataFrame, ISeries } from "data-forge";

import { queryAndWrite } from "../reader/logReader";
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

const generateQueryToGetLogsFromUrlToolForAGivenDate = (day: string) => {
  return {
    bool: {
      must: [
        {
          prefix: {
            url: "https://code.travail.gouv.fr/outils",
          },
        },
        {
          match: { logfile: day },
        },
      ],
    },
  };
};

export const readDaysAndWriteKpi = async (
  index: string,
  days: string[],
  outputFolderName: string
): Promise<void> => {
  const queries = days.map((day) =>
    generateQueryToGetLogsFromUrlToolForAGivenDate(day)
  );
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const computeCompletionRateOfUrlTool = (
  logsOutilDataset: IDataFrame,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  const firstDay = getFirstDayOfMonth(
    logsOutilDataset.getSeries("lastActionDateTime")
  );

  const conventionCollectiveCompletionRate =
    getConventionCollectiveCompletionRate(logsOutilDataset, firstDay, reportId);

  const logsOutilDatasetFiltered = logsOutilDataset.where(
    (row) => row.outilAction == "view_step"
  );

  const visitsByUrlAndEvent = getNumberOfVisitsByOutilAndEvent(
    logsOutilDatasetFiltered
  );

  const listOfKpisCompletionRate = getListOfKpiCompletionRate(
    visitsByUrlAndEvent,
    firstDay,
    reportId
  );

  listOfKpisCompletionRate.push(conventionCollectiveCompletionRate);

  return listOfKpisCompletionRate;
};
