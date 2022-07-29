import { IDataFrame } from "data-forge";

import {
  countOccurrencesOfAGivenTypeInDf,
  dfDropDuplicatesOnUrlAndIdVisitAndType,
  filterDataframeByUrlWithPrefix,
  getRateWith2decimalsGivenNumeratorAndDenominator,
  removeAnchorFromUrl,
} from "../kpi";
import { KpiReport } from "../reports";

type KpiRate = { denominator: number; numerator: number; rate: number };

export const getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates = (
  logs: IDataFrame,
  typeDenominator: string,
  typeNumerator: string
): KpiRate => {
  const uniqueLogs = dfDropDuplicatesOnUrlAndIdVisitAndType(logs).bake();

  const denominator = countOccurrencesOfAGivenTypeInDf(uniqueLogs, typeDenominator);
  const numerator = countOccurrencesOfAGivenTypeInDf(uniqueLogs, typeNumerator);
  const rate = getRateWith2decimalsGivenNumeratorAndDenominator(
    denominator,
    numerator
  );

  return {
    denominator: denominator,
    numerator: numerator,
    rate: rate,
  };
};

export const getRateOfSuccessfulSearchesWhenLookingForACcInCertainTools = (
  logs: IDataFrame
): KpiRate => {
  return getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(
    logs,
    "cc_search",
    "cc_select_p1"
  );
};

export const getRateOfSuccessfulSearchesWhenLookingForAnEnterpriseInCertainTools =
  (logs: IDataFrame): KpiRate => {
    return getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(
      logs,
      "enterprise_search",
      "enterprise_select"
    );
  };

export const getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools =
  (logs: IDataFrame): KpiRate[] => {
    const logsTools = logs
      .filter(
        (log) =>
          log.url != undefined &&
          (log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-demission") ||
            log.url.startsWith("https://code.travail.gouv.fr/outils/indemnite-precarite") ||
            log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-licenciement") ||
            log.url.startsWith("https://code.travail.gouv.fr/outils/heures-recherche-emploi") ||
            log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-retraite") ||
            log.url.startsWith("https://code.travail.gouv.fr/outils/convention-collective"))
      )
      .bake();
    const rateOfSuccessfulSearchWhenLookingForACcInCertainTools =
      getRateOfSuccessfulSearchesWhenLookingForACcInCertainTools(logsTools);
    const rateOfSuccessfulSearchWhenLookingForAnEnterpriseInCertainTools =
      getRateOfSuccessfulSearchesWhenLookingForAnEnterpriseInCertainTools(logsTools);
    return [
      rateOfSuccessfulSearchWhenLookingForACcInCertainTools,
      rateOfSuccessfulSearchWhenLookingForAnEnterpriseInCertainTools,
    ];
  };

export const getRateOfSuccessfulSearchesWhenLookingForACcInContribPages = (
  logs: IDataFrame
): { denominator: number; numerator: number; rate: number } => {
  const logsContrib = filterDataframeByUrlWithPrefix(
    logs,
    "https://code.travail.gouv.fr/contribution/"
  ).bake();
  return getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(
    logsContrib,
    "cc_search",
    "cc_select"
  );
};

export const getRateOfSuccessfulSearchWhenLookingForACc = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport[] => {
  // We reduce the size of the dataframe in order to remove anchor more efficiently
  const logsWithTypeSelectOrSearch = logs.filter((log) =>
    [
      "cc_search",
      "cc_select",
      "cc_select_p1",
      "enterprise_search",
      "enterprise_select",
    ].includes(log.type)
  );
  const logsWithUrlCleaned = removeAnchorFromUrl(logsWithTypeSelectOrSearch);

  //const subsetLogs = logs.subset(["url", "type", "idVisit"]);

  const rateOfSuccessfulSearchesWhenLookingForACcInContribPages =
    getRateOfSuccessfulSearchesWhenLookingForACcInContribPages(
      logsWithUrlCleaned
    );

  const ratesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools =
    getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools(
      logsWithUrlCleaned
    );
  console.log(
    ratesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools.concat(
      [rateOfSuccessfulSearchesWhenLookingForACcInContribPages]
    )
  );
  return [];
};
