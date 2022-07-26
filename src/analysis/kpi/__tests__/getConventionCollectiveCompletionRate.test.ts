import { DataFrame } from "data-forge";

import { getConventionCollectiveCompletionRate } from "../../kpi";

describe("#getConventionCollectiveCompletionRate", () => {
  it("should return a kpi completion rate for outil convention collective for P1", () => {
    // Given
    const data = [
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_select_p1",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 2,
      kpi_type: "Completion-rate-of-tools",
      numerator: 1,
      outil: "Trouver sa convention collective",
      rate: 0.5,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = getConventionCollectiveCompletionRate(dataset, date, "2020");

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return a kpi completion rate for outil convention collective for P2", () => {
    // Given
    const data = [
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "enterprise_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_select_p2",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "enterprise_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "cc_select_p2",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 3,
        outil: "Trouver sa convention collective",
        type: "enterprise_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 3,
      kpi_type: "Completion-rate-of-tools",
      numerator: 2,
      outil: "Trouver sa convention collective",
      rate: 2 / 3,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = getConventionCollectiveCompletionRate(dataset, date, "2020");

    // Then
    expect(result).toStrictEqual(expected);
  });
});
