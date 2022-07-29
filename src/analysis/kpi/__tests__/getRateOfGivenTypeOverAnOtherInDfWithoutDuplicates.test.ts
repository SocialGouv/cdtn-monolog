import { DataFrame } from "data-forge";

import { getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates } from "../getRateOfSuccessfulSearchWhenLookingForACc";

describe("#getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates", () => {
  it("should count occurrences of a type (being the denominator) and another type (begin the numerator) in a df after removing duplicates and return the two counts and the rate", () => {
    // Given
    const data = [
      { idVisit: 0, type: "cc_search", url: "cdtn/" },
      { idVisit: 0, type: "cc_select", url: "cdtn/" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_0" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_0" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_0" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_0" },
      { idVisit: 1, type: "cc_select", url: "cdtn/outil_0" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_1" },
      { idVisit: 1, type: "cc_select", url: "cdtn/outil_1" },
      { idVisit: 1, type: "cc_search", url: "cdtn/outil_2" },
    ];
    const dataset = new DataFrame(data);
    const denominator = "cc_search";
    const numerator = "cc_select";
    const expected = {
      denominator: 4,
      numerator: 3,
      rate: 75,
    };
    // When
    const result = getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates(
      dataset,
      denominator,
      numerator
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
