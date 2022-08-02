import { DataFrame } from "data-forge";

import { getRateOfSuccessfulSearchesWhenLookingForACcInContribPages } from "../getRateOfSuccessfulSearchWhenLookingForACc";

describe("#getRateOfSuccessfulSearchesWhenLookingForACcInContribPages", () => {
  it("should return dict with numerator, denominator and rate of successful CC searches in contributions", () => {
    // Given
    const data = [
      {
        idVisit: 0,
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/",
      },
      {
        idVisit: 0,
        type: "cc_select",
        url: "https://code.travail.gouv.fr/outils/",
      },
      {
        idVisit: 1,
        type: "cc_search",
        url: "https://code.travail.gouv.fr/contribution/C1",
      },
      {
        idVisit: 1,
        type: "cc_search",
        url: "https://code.travail.gouv.fr/contribution/C1",
      },
      {
        idVisit: 1,
        type: "cc_select",
        url: "https://code.travail.gouv.fr/contribution/C2",
      },
      {
        idVisit: 2,
        type: "cc_search",
        url: "https://code.travail.gouv.fr/contribution/C1",
      },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = {
      denominator: 2,
      kpi_type:
        "Rate-of-successful-results-when-searching-cc-in-contribution-pages",
      numerator: 1,
      outil: "Recherches de CC dans les contributions",
      rate: 50,
      reportId: "2020",
      reportType: "kpi",
      start_date: date,
    };
    // When
    const result = getRateOfSuccessfulSearchesWhenLookingForACcInContribPages(
      dataset,
      date,
      "2020"
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
