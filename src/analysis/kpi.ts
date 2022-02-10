import { IDataFrame, ISeries} from "data-forge";
import { parseISO } from "date-fns";

import { queryAndWrite } from "../reader/logReader";
import { removeAnchor } from "./popularity";
import { KpiReport } from "./reports";

const DICT_OF_OUTILS_WITH_STARTING_AND_ENDING_STEP_EVENT_NAME = {
  "convention-collective": {
    firstStep: "start",
    lastStep: undefined,
  },
  "heures-recherche-emploi": {
    firstStep: "start",
    lastStep: "results",
  },
  "indemnite-licenciement": {
    firstStep: "start",
    lastStep: "indemnite_legale",
  },
  "indemnite-precarite": {
    firstStep: "start",
    lastStep: "indemnite",
  },
  "preavis-demission": {
    firstStep: "start",
    lastStep: "results",
  },
  "preavis-licenciement": {
    firstStep: "start",
    lastStep: "results",
  },
  "preavis-retraite": {
    firstStep: "start",
    lastStep: "result",
  },
  "simulateur-embauche": {
    firstStep: "start",
    lastStep: undefined,
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const cleanUrl = (dataset: IDataFrame) => {
  const newSeries = dataset
    .deflate((row) => row.url)
    .select((value) => removeAnchor(value).split("/").slice(-1).toString());
  return dataset.withSeries({ url_cleaned: newSeries }).dropSeries("url");
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getNumberOfVisitByUrlAndEvent = (dataset: IDataFrame) => {
  return dataset
    .groupBy((row) => [row.url_cleaned, row.outilEvent])
    .select((group) => ({
      nbVisit: group
        .deflate((row) => row.idVisit)
        .distinct()
        .count(),
      outilEvent: group.first().outilEvent,
      url: group.first().url_cleaned,
    }))
    .inflate();
};

export const getNbVisitIfStepDefinedInTool = (
  url: string,
  eventStep: string | undefined,
  dataset: IDataFrame
): number => {
  if (eventStep != undefined) {
    const datasetFiltered = dataset.where(
      (row) => row.url === url && row.outilEvent === eventStep
    );
    if (datasetFiltered.count() > 0) {
      return datasetFiltered.first().nbVisit;
    }
  }
  return 0;
};

export const getListOfKpiCompletionRate = (
  visitsByUrlAndEvent: IDataFrame,
  startDate: string,
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

    // TODO: change start_date
    return {
      denominator: denominator,
      kpi_type: "Completion-rate-of-tools",
      numerator: numerator,
      rate: denominator > 0 ? numerator / denominator : 0,
      reportId: reportId,
      reportType: "kpi",
      start_date: startDate,
      url: key,
    };
  });
};

const getFirstDayOfMonth = (series: ISeries): string => {
  return series.toArray().sort()[0];
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const computeCompletionRateOfUrlTool = (
  dataset: IDataFrame,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  const firstDay = getFirstDayOfMonth(dataset.getSeries("lastActionDateTime"));

  const datasetFiltered = dataset.where(
    (row) => row.outilAction == "view_step"
  );

  const datasetWithCleanUrl = cleanUrl(datasetFiltered);

  const visitsByUrlAndEvent =
    getNumberOfVisitByUrlAndEvent(datasetWithCleanUrl);

  return getListOfKpiCompletionRate(visitsByUrlAndEvent, firstDay, reportId);
};
