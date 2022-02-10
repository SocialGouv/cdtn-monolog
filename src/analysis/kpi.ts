import { IDataFrame } from "data-forge";

import { queryAndWrite } from "../reader/logReader";
import { removeAnchor } from "./popularity";

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

const generateQueryToGetLogsFromUrlOutilForAGivenDate = (day: string) => {
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
    generateQueryToGetLogsFromUrlOutilForAGivenDate(day)
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

export const getNbVisitIfStepDefinedInOutil = (
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

export const getListOfKpiCompletionRate = (visitsByUrlAndEvent: IDataFrame) => {
  return Object.entries(
    DICT_OF_OUTILS_WITH_STARTING_AND_ENDING_STEP_EVENT_NAME
  ).map(([key, value]) => {
    const numerator = getNbVisitIfStepDefinedInOutil(
      key,
      value.lastStep,
      visitsByUrlAndEvent
    );
    const denominator = getNbVisitIfStepDefinedInOutil(
      key,
      value.firstStep,
      visitsByUrlAndEvent
    );

    // TODO: change start_date
    return {
      denominator: denominator,
      kpi_type: "Completion rate of /outils/ urls",
      numerator: numerator,
      rate: denominator > 0 ? numerator / denominator : 0,
      start_date: "january",
      url: key,
    };
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const computeCompletionRateOfUrlOutil = (dataset: IDataFrame) => {
  const datasetFiltered = dataset.where(
    (row) => row.outilAction == "view_step"
  );
  const datasetWithCleanUrl = cleanUrl(datasetFiltered);

  const visitsByUrlAndEvent =
    getNumberOfVisitByUrlAndEvent(datasetWithCleanUrl);

  return getListOfKpiCompletionRate(visitsByUrlAndEvent);
};
