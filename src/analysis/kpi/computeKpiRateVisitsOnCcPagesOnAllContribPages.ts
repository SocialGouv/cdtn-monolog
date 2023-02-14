import { IDataFrame } from "data-forge";

import {
  countOccurrencesOfAGivenTypeInDf,
  dfDropDuplicatesOnUrlAndIdVisitAndType,
  filterDataframeByContribAndRemoveAnchorFromUrl,
  formatKpiReport,
} from "../kpi";
import { KpiReport } from "../reports";

export const getVisitsOnContribWithoutIdcc = (dataset: IDataFrame): IDataFrame => {
  return dataset.filter((log) => /^https:\/\/code.travail.gouv.fr\/contribution\/[a-zA-Z]+/.test(log.url));
};

export const getVisitsOnContribWithIdcc = (dataset: IDataFrame): IDataFrame => {
  return dataset.filter((log) => /^https:\/\/code.travail.gouv.fr\/contribution\/[0-9]+/.test(log.url));
};

export const computeRateOfCcSelectOverVisitsOnContribWithoutIdcc = (
  dataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  const logsOnContribWithoutIdcc = getVisitsOnContribWithoutIdcc(dataset);
  const nbTotalVisitsOnContribWithoutIdcc = countOccurrencesOfAGivenTypeInDf(logsOnContribWithoutIdcc, "visit_content");
  const nbCcSelectOnContribWithoutIdcc = countOccurrencesOfAGivenTypeInDf(logsOnContribWithoutIdcc, "cc_select");

  return formatKpiReport(
    nbTotalVisitsOnContribWithoutIdcc,
    "Rate-of-cc-select-on-pages-contribution-without-idcc",
    nbCcSelectOnContribWithoutIdcc,
    reportId,
    startDate,
    "pages-contribution"
  );
};

export const computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib = (
  dataset: IDataFrame,
  startDate: Date,
  reportId: string
): KpiReport => {
  // Compute denominator
  const nbTotalVisitsOnContrib = countOccurrencesOfAGivenTypeInDf(dataset, "visit_content");

  // Compute numerator (sum of the two subTotal following)
  const logsOnContribWithIdcc = getVisitsOnContribWithIdcc(dataset);
  const nbTotalVisitsOnContribWithIdcc = countOccurrencesOfAGivenTypeInDf(logsOnContribWithIdcc, "visit_content");
  const nbCcSelectOnContrib = countOccurrencesOfAGivenTypeInDf(dataset, "cc_select");
  const numerator = nbCcSelectOnContrib + nbTotalVisitsOnContribWithIdcc;

  return formatKpiReport(
    nbTotalVisitsOnContrib,
    "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
    numerator,
    reportId,
    startDate,
    "pages-contribution"
  );
};

export const computeKpiRateVisitsOnCcPagesOnAllContribPages = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  // Get logs on pages contribution without duplicates in triple (url, idVisit, type)
  const logsOnContrib = filterDataframeByContribAndRemoveAnchorFromUrl(logs);
  const logsOnContribWithoutDuplicates = dfDropDuplicatesOnUrlAndIdVisitAndType(logsOnContrib);

  // KPI Rate of persons selecting a cc in non-personalized contribution pages
  const rateOfCcSelectOverVisitsOnContribWithoutIdcc = computeRateOfCcSelectOverVisitsOnContribWithoutIdcc(
    logsOnContribWithoutDuplicates,
    startDate,
    reportId
  );

  // KPI Rate of persons getting a personalized pages in all contribution pages
  const rateOfCcSelectAndNbCcPagesOverVisitsOnContrib = computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib(
    logsOnContribWithoutDuplicates,
    startDate,
    reportId
  );

  return [rateOfCcSelectOverVisitsOnContribWithoutIdcc, rateOfCcSelectAndNbCcPagesOverVisitsOnContrib];
};
