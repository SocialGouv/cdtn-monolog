import { DataFrame } from "data-forge";

import { getNumberOfVisitsByOutilAndEvent } from "../computeCompletionRateOfUrlTool";

describe("#getNumberOfVisitsByOutilAndEvent", () => {
  it("should return list of visits by event and url", () => {
    const data = [
      {
        idVisit: 1,
        outil: "indemnite-licenc",
        outilEvent: "start",
      },
      {
        idVisit: 2,
        outil: "indemnite-licenc",
        outilEvent: "start",
      },
      {
        idVisit: 2,
        outil: "indemnite-licenc",
        outilEvent: "random",
      },
      { idVisit: 2, outil: "mon-outil", outilEvent: "start" },
      { idVisit: 2, outil: "mon-outil", outilEvent: "results" },
      { idVisit: 3, outil: "mon-outil", outilEvent: "aze" },
      { idVisit: 3, outil: "mon-outil", outilEvent: "start" },
      { idVisit: 3, outil: "mon-outil", outilEvent: "results" },
      { idVisit: 3, outil: "mon-outil", outilEvent: "results" },
      { idVisit: 4, outil: "mon-outil", outilEvent: "outil" },
      { idVisit: 4, outil: "mon-outil", outilEvent: "second" },
      { idVisit: 4, outil: "mon-outil", outilEvent: "results" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { nbVisit: 2, outil: "indemnite-licenc", outilEvent: "start" },
      { nbVisit: 1, outil: "indemnite-licenc", outilEvent: "random" },
      { nbVisit: 2, outil: "mon-outil", outilEvent: "start" },
      { nbVisit: 3, outil: "mon-outil", outilEvent: "results" },
      { nbVisit: 1, outil: "mon-outil", outilEvent: "aze" },
      { nbVisit: 1, outil: "mon-outil", outilEvent: "outil" },
      { nbVisit: 1, outil: "mon-outil", outilEvent: "second" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = getNumberOfVisitsByOutilAndEvent(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
  it("should remove duplicates for a given visitor", () => {
    const data = [
      { idVisit: 5, outil: "preavis", outilEvent: "start" },
      { idVisit: 5, outil: "preavis", outilEvent: "start" },
      { idVisit: 5, outil: "preavis", outilEvent: "start" },
      { idVisit: 5, outil: "preavis", outilEvent: "start" },
      { idVisit: 5, outil: "preavis", outilEvent: "results" },
      { idVisit: 5, outil: "preavis", outilEvent: "results" },
      { idVisit: 5, outil: "preavis", outilEvent: "results" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { nbVisit: 1, outil: "preavis", outilEvent: "start" },
      { nbVisit: 1, outil: "preavis", outilEvent: "results" },
    ];
    const datasetExpected = new DataFrame(dataExpected);

    // When
    const result = getNumberOfVisitsByOutilAndEvent(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
