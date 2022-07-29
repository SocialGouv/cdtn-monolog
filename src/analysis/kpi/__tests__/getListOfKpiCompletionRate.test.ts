import { DataFrame } from "data-forge";

import { getListOfKpiCompletionRate } from "../computeCompletionRateOfUrlTool";

describe("#getListOfKpiCompletionRate", () => {
  it("should return list of kpi completion rate by url", () => {
    // Given
    const data = [
      {
        nbVisit: 100,
        outil: "Heures d'absence pour rechercher un emploi",
        outilEvent: "start",
      },
      {
        nbVisit: 90,
        outil: "Heures d'absence pour rechercher un emploi",
        outilEvent: "results",
      },
      {
        nbVisit: 1111,
        outil: "Indemnité de licenciement",
        outilEvent: "start",
      },
      {
        nbVisit: 999,
        outil: "Indemnité de licenciement",
        outilEvent: "step1",
      },
      {
        nbVisit: 777,
        outil: "Indemnité de licenciement",
        outilEvent: "step2",
      },
      {
        nbVisit: 555,
        outil: "Indemnité de licenciement",
        outilEvent: "indemnite_legale",
      },
      {
        nbVisit: 900,
        outil: "Trouver sa convention collective",
        outilEvent: "start",
      },
      {
        nbVisit: 800,
        outil: "Trouver sa convention collective",
        outilEvent: "step",
      },
      {
        nbVisit: 700,
        outil: "Trouver sa convention collective",
        outilEvent: "results",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = [
      {
        denominator: 100,
        kpi_type: "Completion-rate-of-tools",
        numerator: 90,
        outil: "Heures d'absence pour rechercher un emploi",
        rate: 0.9,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
      {
        denominator: 1111,
        kpi_type: "Completion-rate-of-tools",
        numerator: 555,
        outil: "Indemnité de licenciement",
        rate: 555 / 1111,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
      {
        denominator: 0,
        kpi_type: "Completion-rate-of-tools",
        numerator: 0,
        outil: "Indemnité de précarité",
        rate: 0,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
    ];
    // When
    const result = getListOfKpiCompletionRate(dataset, date, "2020");

    // Then
    expect(result[0]).toStrictEqual(expected[0]);
    expect(result[1]).toStrictEqual(expected[1]);
    expect(result[2]).toStrictEqual(expected[2]);
  });
});
