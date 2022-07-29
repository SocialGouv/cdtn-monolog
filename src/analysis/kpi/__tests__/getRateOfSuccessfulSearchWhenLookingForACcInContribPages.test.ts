import { DataFrame } from "data-forge";

import { getRateOfSuccessfulSearchesWhenLookingForACcInContribPages } from "../getRateOfSuccessfulSearchWhenLookingForACc";

describe("#getRateOfSuccessfulSearchWhenLookingForACcInContribPages", () => {
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
    const expected = {
      denominator: 2,
      numerator: 1,
      rate: 50,
    };
    // When
    const result =
      getRateOfSuccessfulSearchesWhenLookingForACcInContribPages(dataset);

    // Then
    expect(result).toStrictEqual(expected);
  });
});
