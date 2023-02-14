import { DataFrame } from "data-forge";

import { getProcedureLicenciementCompletionRate } from "../computeCompletionRateOfUrlTool";

describe("#getProcedureLicenciementCompletionRate", () => {
  it("should return a kpi completion rate for outil 'comprendre sa procédure de licenciement'", () => {
    // Given
    const data = [
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 2,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "comprendre_sa_procedure_de_licenciement",
        outilEvent: "click_afficher_les_infos_personnalisées",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "comprendre_sa_procedure_de_licenciement",
        outilEvent: "click_afficher_les_infos_personnalisées",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 2,
      kpi_type: "Completion-rate-of-tools",
      numerator: 1,
      outil: "Comprendre sa procédure de licenciement",
      rate: 50,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = getProcedureLicenciementCompletionRate(dataset, date, "2020");

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return a kpi completion rate for outil convention collective without duplicate action", () => {
    // Given
    const data = [
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 1,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "comprendre_sa_procedure_de_licenciement",
        outilEvent: "click_afficher_les_infos_personnalisées",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 2,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 2,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "comprendre_sa_procedure_de_licenciement",
        outilEvent: "click_afficher_les_infos_personnalisées",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 3,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "view_step",
        outilEvent: "start",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
      {
        idVisit: 3,
        outil: "Comprendre sa procédure de licenciement",
        outilAction: "comprendre_sa_procedure_de_licenciement",
        outilEvent: "click",
        type: "enterprise_search",
        url: "https://code.travail.gouv.fr/outils/procedure-licenciement",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 3,
      kpi_type: "Completion-rate-of-tools",
      numerator: 2,
      outil: "Comprendre sa procédure de licenciement",
      rate: 66.67,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = getProcedureLicenciementCompletionRate(dataset, date, "2020");

    // Then
    expect(result).toStrictEqual(expected);
  });
});
