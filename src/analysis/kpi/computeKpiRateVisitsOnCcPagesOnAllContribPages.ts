import { IDataFrame } from "data-forge";

import {
  countOccurrencesOfAGivenTypeInDf,
  dfContribDropDuplicates,
  filterDataframeByContribAndRemoveAnchorFromUrl,
} from "../kpi";
import { KpiReport } from "../reports";

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
