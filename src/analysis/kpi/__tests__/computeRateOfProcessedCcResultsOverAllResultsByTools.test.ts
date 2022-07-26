import { DataFrame } from "data-forge";

import { KpiReport } from "../../reports";
import {computeRateOfProcessedCcResultsOverAllResultsByTools} from "../computeRateOfProcessedCcResultsOverAllResultsByTools";

describe("#computeRateOfProcessedCcResultsOverAllResultsByTools - Integration test", () => {
  it("should return list of KpiReport formatted having the rate of processed CC results over all results", () => {
    const reportId = "2020";
    const startDate = new Date("2020-01-01T00:00:00.000");
    const data = [
      {
        idVisit: "1",
        outilEvent: "_",
        type: "visit",
        url: "https://code.travail.gouv.fr/contribution/",
      },
      {
        idVisit: "1",
        outilEvent: "_",
        type: "visit",
        url: "https://code.travail.gouv.fr/outils/",
      },
      {
        idVisit: "1",
        outilEvent: "start",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "select_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "cc_select_non_traitée",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/indemnite-precarite",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/indemnite-precarite",
      },
      {
        idVisit: "1",
        outilEvent: "indemnite",
        type: "",
        url: "https://code.travail.gouv.fr/outils/indemnite-precarite",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "1",
        outilEvent: "result",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "2",
        outilEvent: "info_cc",
        type: "cc_select_non_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "2",
        outilEvent: "result",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "3",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "4",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
      {
        idVisit: "4",
        outilEvent: "result",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-retraite",
      },
    ];
    const dataset = new DataFrame(data);
    const dataExpected: KpiReport[] = [
      {
        denominator: 1,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: 0,
        outil: "Heures d'absence pour rechercher un emploi",
        rate: 0,
        reportId: "2020",
        reportType: "kpi",
        start_date: startDate,
      },
      {
        denominator: 1,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: 1,
        outil: "Indemnité de précarité",
        rate: 100,
        reportId: "2020",
        reportType: "kpi",
        start_date: startDate,
      },
      {
        denominator: 1,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: 1,
        outil: "Préavis de démission",
        rate: 100,
        reportId: "2020",
        reportType: "kpi",
        start_date: startDate,
      },
      {
        denominator: 0,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: 0,
        outil: "Préavis de licenciement",
        rate: 0,
        reportId: "2020",
        reportType: "kpi",
        start_date: startDate,
      },
      {
        denominator: 3,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: 2,
        outil: "Préavis de départ ou de mise à la retraite",
        rate: 66.67,
        reportId: "2020",
        reportType: "kpi",
        start_date: startDate,
      },
    ];
    // When
    const result = computeRateOfProcessedCcResultsOverAllResultsByTools(
      dataset,
      startDate,
      reportId
    );

    // Then
    expect(result).toStrictEqual(dataExpected);
  });
});
