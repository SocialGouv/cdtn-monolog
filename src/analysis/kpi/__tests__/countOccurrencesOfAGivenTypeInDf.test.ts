import { DataFrame } from "data-forge";

import { countOccurrencesOfAGivenTypeInDf } from "../../kpi";

describe("#countOccurrencesOfAGivenTypeInDf", () => {
  it("count the occurence of a given type in series type of a dataframe", () => {
    const data = [
      { idVisit: 1, type: "cc_search", url: "mon-outil" },
      { idVisit: 1, type: "visit_content", url: "mon-outil" },
      { idVisit: 1, type: "cc_select", url: "mon-outil" },
      { idVisit: 2, type: "visit_content", url: "mon-outil" },
      { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
      { idVisit: 2, type: "cc_select", url: "mon-outil" },
      { idVisit: 3, type: "visit_content", url: "mon-outil" },
    ];
    const dataset = new DataFrame(data);
    const expected = 3;
    // When
    const result = countOccurrencesOfAGivenTypeInDf(dataset, "visit_content");

    // Then
    expect(result).toStrictEqual(expected);
  });
});
