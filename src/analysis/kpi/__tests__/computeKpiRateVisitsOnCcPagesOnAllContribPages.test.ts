import { DataFrame } from "data-forge";

import { computeKpiRateVisitsOnCcPagesOnAllContribPages } from "../computeKpiRateVisitsOnCcPagesOnAllContribPages";

describe("#computeKpiRateVisitsOnCcPagesOnAllContribPages - Integration test", () => {
  it("should return list contrib with url formated", () => {
    // Given
    const date = new Date("2020-01-01T00:00:00.000");
    const data = [
      {
        idVisit: 1,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page0",
      },
      {
        idVisit: 1,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        idVisit: 1,
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        idVisit: 1,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/123-page1",
      },
      {
        idVisit: 2,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
      {
        idVisit: 2,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1#3",
      },
      {
        idVisit: 2,
        type: "visit_content",
        url: "https://code.travail.gouv.fr/contribution/page1?az=2",
      },
      {
        idVisit: 2,
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/page1",
      },
    ];
    const dataset = new DataFrame(data);
    const expected = [
      {
        denominator: 3,
        kpi_type: "Rate-of-cc-select-on-pages-contribution-without-idcc",
        numerator: 2,
        outil: "pages-contribution",
        rate: 66.667,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
      {
        denominator: 4,
        kpi_type:
          "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
        numerator: 3,
        outil: "pages-contribution",
        rate: 75,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
    ];
    // When
    const result = computeKpiRateVisitsOnCcPagesOnAllContribPages(
      dataset,
      date,
      "2020"
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
