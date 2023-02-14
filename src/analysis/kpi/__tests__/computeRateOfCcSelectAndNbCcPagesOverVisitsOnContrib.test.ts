import { DataFrame } from "data-forge";

import { computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib } from "../computeKpiRateVisitsOnCcPagesOnAllContribPages";

describe("#computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib", () => {
  it("should compute rate of persons getting a personalized pages in all contribution pages", () => {
    // Given
    const date = new Date("2020-01-01T00:00:00.000");
    const data = [
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/123-page1",
      },
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/123-page1",
      },
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/page1-123456",
      },
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page-2",
      },
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/PAGE2",
      },
      {
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/R3-page2",
      },
      {
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page2",
      },
    ];
    const dataset = new DataFrame(data);
    const expected = {
      denominator: 6,
      kpi_type: "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
      numerator: 5,
      outil: "pages-contribution",
      rate: 83.33,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib(dataset, date, "2020");

    // Then
    expect(result).toStrictEqual(expected);
  });
});
