import { DataFrame } from "data-forge";

import { getNbVisitIfStepDefinedInTool } from "../../kpi";

describe("#getNbVisitIfStepDefinedInTool", () => {
  it("should return the number of visits for a given url and start step", () => {
    // Given
    const data = [
      { nbVisit: 10, outil: "simulateur-embauche", outilEvent: "start" },
      { nbVisit: 678, outil: "simulateur", outilEvent: "start" },
      { nbVisit: 8, outil: "simulateur-embauche", outilEvent: "result" },
      { nbVisit: 3, outil: "simulateur-embauche", outilEvent: "results" },
      { nbVisit: 9, outil: "simulateur-embauche", outilEvent: "inter" },
    ];
    const dataset = new DataFrame(data);
    const url = "simulateur-embauche";
    const step = "start";
    const expected = 10;

    // When
    const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return the number of visits for a given url and results step", () => {
    // Given
    const data = [
      { nbVisit: 10, outil: "simulateur-embauche", outilEvent: "start" },
      { nbVisit: 678, outil: "simulateur", outilEvent: "start" },
      { nbVisit: 8, outil: "simulateur-embauche", outilEvent: "result" },
      { nbVisit: 3, outil: "simulateur-embauche", outilEvent: "results" },
      { nbVisit: 9, outil: "simulateur-embauche", outilEvent: "inter" },
    ];
    const dataset = new DataFrame(data);
    const url = "simulateur-embauche";
    const step = "results";
    const expected = 3;

    // When
    const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return 0 if the step is undefined", () => {
    // Given
    const data = [
      { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
      { nbVisit: 678, outilEvent: "start", url: "simulateur" },
      { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
      { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
      { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
    ];
    const dataset = new DataFrame(data);
    const url = "simulateur-embauche";
    const step = undefined;
    const expected = 0;

    // When
    const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return 0 if there is no corresponding entries in the dataset", () => {
    // Given
    const data = [
      { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
      { nbVisit: 678, outilEvent: "start", url: "simulateur" },
      { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
      { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
      { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
    ];
    const dataset = new DataFrame(data);
    const url = "simulateur-embauche";
    const step = "step-finale";
    const expected = 0;

    // When
    const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

    // Then
    expect(result).toStrictEqual(expected);
  });
});
