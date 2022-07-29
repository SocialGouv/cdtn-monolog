import { IDataFrame } from "data-forge";

import {
  countOccurrencesOfAGivenTypeInDf,
  dfDropDuplicatesOnUrlAndIdVisitAndType,
  filterDataframeByUrlWithPrefix,
  getRateWith2decimalsGivenNumeratorAndDenominator,
  removeAnchorFromUrl,
} from "../kpi";
import { KpiReport } from "../reports";

export const getRateOfSuccessfulSearchWhenLookingForACcInContribPages = (
  logs: IDataFrame
): { denominator: number; numerator: number; rate: number } => {
  const logsContrib = filterDataframeByUrlWithPrefix(
    logs,
    "https://code.travail.gouv.fr/contribution/"
  );
  const uniqueLogs = dfDropDuplicatesOnUrlAndIdVisitAndType(logsContrib).bake();
  const denominator = countOccurrencesOfAGivenTypeInDf(uniqueLogs, "cc_search");
  const numerator = countOccurrencesOfAGivenTypeInDf(uniqueLogs, "cc_select");
  const rate = getRateWith2decimalsGivenNumeratorAndDenominator(
    denominator,
    numerator
  );
  return {
    denominator,
    numerator,
    rate,
  };
};

export const getRateOfSuccessfulSearchWhenLookingForACc = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport[] => {
  // We reduce the size of the dataframe in order to remove anchor more efficiently
  const logsWithTypeSelectOrSearch = logs.filter((log) =>
    ["cc_search", "cc_select"].includes(log.type)
  );
  const logsWithUrlCleaned = removeAnchorFromUrl(logsWithTypeSelectOrSearch);

  //const subsetLogs = logs.subset(["url", "type", "idVisit"]);

  const rateOfSuccessfulSearchWhenLookingForACcInContribPages =
    getRateOfSuccessfulSearchWhenLookingForACcInContribPages(
      logsWithUrlCleaned
    );

  console.log(rateOfSuccessfulSearchWhenLookingForACcInContribPages);
  return [];
};
