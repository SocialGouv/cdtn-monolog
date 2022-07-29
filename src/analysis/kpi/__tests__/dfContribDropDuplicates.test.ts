import { DataFrame } from "data-forge";

import { dfDropDuplicatesOnUrlAndIdVisitAndType } from "../../kpi";

describe("#dfContribDropDuplicates", () => {
  it("should return df of contrib without duplicates", () => {
    const data = [
      { idVisit: 1, type: "cc_search", url: "mon-outil" },
      { idVisit: 1, type: "cc_search", url: "mon-outil" },
      { idVisit: 1, type: "cc_select", url: "mon-outil" },
      { idVisit: 2, type: "cc_search", url: "mon-outil" },
      { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
      { idVisit: 2, type: "cc_select", url: "mon-outil" },
      { idVisit: 2, type: "cc_select", url: "mon-autre-outil" },
      { idVisit: 3, type: "cc_search", url: "mon-outil" },
      { idVisit: 3, type: "cc_select", url: "mon-outil" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { idVisit: 1, type: "cc_search", url: "mon-outil" },
      { idVisit: 1, type: "cc_select", url: "mon-outil" },
      { idVisit: 2, type: "cc_search", url: "mon-outil" },
      { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
      { idVisit: 2, type: "cc_select", url: "mon-outil" },
      { idVisit: 2, type: "cc_select", url: "mon-autre-outil" },
      { idVisit: 3, type: "cc_search", url: "mon-outil" },
      { idVisit: 3, type: "cc_select", url: "mon-outil" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = dfDropDuplicatesOnUrlAndIdVisitAndType(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
