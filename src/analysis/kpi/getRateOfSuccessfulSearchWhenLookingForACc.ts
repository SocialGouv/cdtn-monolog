import { IDataFrame } from "data-forge";

import {
  countOccurrencesOfAGivenTypeInDf,
  dfDropDuplicatesOnUrlAndIdVisitAndType,
  filterDataframeByUrlWithPrefix,
  formatKpiReport,
  removeAnchorFromUrl,
} from "../kpi";
import { KpiReport } from "../reports";

type KpiRate = { denominator: number; numerator: number };

export const getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates = (
  logs: IDataFrame,
  typeDenominator: string,
  typeNumerator: string
): KpiRate => {
  const uniqueLogs = dfDropDuplicatesOnUrlAndIdVisitAndType(logs).bake();

  return {
    denominator: countOccurrencesOfAGivenTypeInDf(uniqueLogs, typeDenominator),
    numerator: countOccurrencesOfAGivenTypeInDf(uniqueLogs, typeNumerator),
  };
};

export const getRateOfSuccessfulSearchesWhenLookingForACcInCertainTools = (logs: IDataFrame): KpiRate => {
  return getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(logs, "cc_search", "cc_select_p1");
};

export const getRateOfSuccessfulSearchesWhenLookingForAnEnterpriseInCertainTools = (logs: IDataFrame): KpiRate => {
  return getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(logs, "enterprise_search", "enterprise_select");
};

/**
 * This function compute the rate of successful searches (when clicking on a result) for visitors searching for a cc or an enterprise in
 *  tools above all visitors making at lease when search of cc or enterprise in tools and return them in the form of a list of KpiReport
 *
 * @param {IDataFrame} logs - the dataframe containing all logs
 * @param {Date} startDate - the first day of the month using to order the report in kibana
 * @param {string} reportId - the timestamp in string of the date where the script is running
 **/
export const getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport[] => {
  const logsTools = logs
    .filter(
      (log) =>
        log.url != undefined &&
        (log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-demission") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/indemnite-precarite") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-licenciement") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/heures-recherche-emploi") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/preavis-retraite") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/convention-collective") ||
          log.url.startsWith("https://code.travail.gouv.fr/outils/indemnite-licenciement"))
    )
    .bake();
  const rateOfSuccessfulSearchWhenLookingForACcInCertainTools =
    getRateOfSuccessfulSearchesWhenLookingForACcInCertainTools(logsTools);
  const rateOfSuccessfulSearchWhenLookingForAnEnterpriseInCertainTools =
    getRateOfSuccessfulSearchesWhenLookingForAnEnterpriseInCertainTools(logsTools);

  return [
    formatKpiReport(
      rateOfSuccessfulSearchWhenLookingForACcInCertainTools.denominator,
      "Rate-of-successful-results-when-searching-cc-in-tools",
      rateOfSuccessfulSearchWhenLookingForACcInCertainTools.numerator,
      reportId,
      startDate,
      "Recherches de CC dans les outils"
    ),
    formatKpiReport(
      rateOfSuccessfulSearchWhenLookingForAnEnterpriseInCertainTools.denominator,
      "Rate-of-successful-results-when-searching-enterprise-in-tools",
      rateOfSuccessfulSearchWhenLookingForAnEnterpriseInCertainTools.numerator,
      reportId,
      startDate,
      "Recherches d'entreprises dans les outils"
    ),
  ];
};

/**
 * This function compute the rate of successful searches (when clicking on a result) for visitors searching for a cc in
 *  contribution pages above all visitors making at lease when search of cc in these pages and return it in the form of a KpiReport
 *
 * @param {IDataFrame} logs - the dataframe containing all logs
 * @param {Date} startDate - the first day of the month using to order the report in kibana
 * @param {string} reportId - the timestamp in string of the date where the script is running
 **/
export const getRateOfSuccessfulSearchesWhenLookingForACcInContribPages = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  const logsContrib = filterDataframeByUrlWithPrefix(logs, "https://code.travail.gouv.fr/contribution/").bake();

  const rateOfSuccessfulSearches = getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(
    logsContrib,
    "cc_search",
    "cc_select"
  );

  return formatKpiReport(
    rateOfSuccessfulSearches.denominator,
    "Rate-of-successful-results-when-searching-cc-in-contribution-pages",
    rateOfSuccessfulSearches.numerator,
    reportId,
    startDate,
    "Recherches de CC dans les contributions"
  );
};

/**
 * This function compute the rate of successful searches (when clicking on a result) for visitors searching for a cc or an enterprise above all visitors making at lease when search of cc or enterprise,
 *  compute this ratio for certain tools and for contribution pages and return them in the form of a list of KpiReport
 *
 * @param {IDataFrame} logs - the dataframe containing all logs
 * @param {Date} startDate - the first day of the month using to order the report in kibana
 * @param {string} reportId - the timestamp in string of the date where the script is running
 **/
export const getRateOfSuccessfulSearchWhenLookingForACc = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport[] => {
  // We reduce the size of the dataframe in order to remove anchor more efficiently
  const logsWithTypeSelectOrSearch = logs.filter((log) =>
    ["cc_search", "cc_select", "cc_select_p1", "enterprise_search", "enterprise_select"].includes(log.type)
  );
  const logsWithUrlCleaned = removeAnchorFromUrl(logsWithTypeSelectOrSearch);

  //const subsetLogs = logs.subset(["url", "type", "idVisit"]);

  const rateOfSuccessfulSearchesWhenLookingForACcInContribPages =
    getRateOfSuccessfulSearchesWhenLookingForACcInContribPages(logsWithUrlCleaned, startDate, reportId);

  const ratesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools =
    getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools(logsWithUrlCleaned, startDate, reportId);

  return ratesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools.concat([
    rateOfSuccessfulSearchesWhenLookingForACcInContribPages,
  ]);
};
