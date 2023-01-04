import { IDataFrame } from "data-forge";

import {
  filterDataframeByUrlWithPrefix,
  formatKpiReport,
  getRateWith2decimalsGivenDenominatorAndNumerator,
} from "../kpi";
import { KpiReport } from "../reports";

const DICT_OF_OUTILS_WITH_STARTING_AND_ENDING_STEP_EVENT_NAME = {
  "Heures d'absence pour rechercher un emploi": {
    firstStep: "start",
    lastStep: "results",
  },
  "Indemnité de licenciement": {
    firstStep: "start",
    lastStep: "results",
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

const getValInDfIfIndexIsInList = (
  index: string,
  df: IDataFrame<string, number>
): number => {
  const list = df.getIndex().toArray();
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

  const denominator = logsConventionCollectiveDataset
    .where(
      (row) => row.outilAction == "view_step" && row.outilEvent === "start"
    )
    .distinct((row) => row.idVisit)
    .count();

  const nbVisitsByCcType = getNumberOfVisitsByCcType(
    logsConventionCollectiveDataset
  );

  const numerator =
    getValInDfIfIndexIsInList("cc_select_p1", nbVisitsByCcType) +
    getValInDfIfIndexIsInList("cc_select_p2", nbVisitsByCcType);

  const numerator2 = logsConventionCollectiveDataset
    .where(
      (row) => row.outilAction == "view_step" && row.outilEvent === "start"
    )
    .distinct((row) => row.idVisit)
    .count();

  return formatKpiReport(
    denominator,
    "Completion-rate-of-tools",
    numerator,
    reportId,
    startDate,
    "Trouver sa convention collective"
  );
};

export const getProcedureLicenciementCompletionRate = (
  logsOutilDataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  const logsProcedureLicenciementDataset = logsOutilDataset.where(
    (log) =>
      log.url != undefined &&
      log.url.startsWith(
        "https://code.travail.gouv.fr/outils/procedure-licenciement"
      )
  );

  const denominator = logsProcedureLicenciementDataset
    .where((row) => row.outilAction == "view_step" && row.outilEvent == "start")
    .distinct((row) => row.idVisit)
    .count();

  const numerator = logsProcedureLicenciementDataset
    .where(
      (row) =>
        row.outilAction == "comprendre_sa_procedure_de_licenciement" &&
        row.outilEvent == "click_afficher_les_infos_personnalisées"
    )
    .distinct((row) => row.idVisit)
    .count();

  return formatKpiReport(
    denominator,
    "Completion-rate-of-tools",
    numerator,
    reportId,
    startDate,
    "Comprendre sa procédure de licenciement"
  );
};

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

    return formatKpiReport(
      denominator,
      "Completion-rate-of-tools",
      numerator,
      reportId,
      startDate,
      key
    );
  });
};

export const computeCompletionRateOfUrlTool = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString(),
  url = "https://code.travail.gouv.fr/outils"
): KpiReport[] => {
  // Get logs on tools
  const logsOutil = filterDataframeByUrlWithPrefix(logs, url);

  // Some tools's completion rate are computed differently. Let's compute them first
  // Compute completion rate of convention collective tool first
  const conventionCollectiveCompletionRate =
    getConventionCollectiveCompletionRate(logsOutil, startDate, reportId);

  // Compute completion rate of tool 'comprendre sa procédure de licenciement'
  const procedureLicenciementCompletionRate =
    getProcedureLicenciementCompletionRate(logsOutil, startDate, reportId);

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

  return listOfKpisCompletionRate.concat([
    conventionCollectiveCompletionRate,
    procedureLicenciementCompletionRate,
  ]);
};
