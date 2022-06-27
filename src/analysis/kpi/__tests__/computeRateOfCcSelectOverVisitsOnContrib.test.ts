import { DataFrame } from "data-forge";

import { computeRateOfCcSelectOverVisitsOnContribWithoutIdcc } from "../../kpi";

describe("#computeRateOfCcSelectOverVisitsOnContrib", () => {
  it("should compute rate of persons selecting a cc in non-personalized contribution pages", () => {
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
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 4,
      kpi_type: "Rate-of-cc-select-on-pages-contribution-without-idcc",
      numerator: 3,
      outil: "pages-contribution",
      rate: 75,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = computeRateOfCcSelectOverVisitsOnContribWithoutIdcc(
      dataset,
      date,
      "2020"
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
