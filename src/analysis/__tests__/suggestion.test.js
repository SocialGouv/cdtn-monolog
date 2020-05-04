import * as Suggestion from "../suggestion";
import * as util from "../../util";
import { DataFrame } from "data-forge";

describe("Suggestion", () => {
  const toSuggestionSelectionAction = (uvi, suggestionSelection) => ({
    uvi,
    suggestionSelection,
    type: util.actionTypes.selectSuggestionType,
  });

  const generate = (a) =>
    new DataFrame(a.map(([uvi, ss]) => toSuggestionSelectionAction(uvi, ss)));

  it("should be unique per visit", () => {
    const actions = generate([
      [1, "q1"],
      [1, "q1"],
      [1, "q2"],
    ]);
    expect(Suggestion.analyse(actions)).toMatchSnapshot();
  });

  it("should be weighted properly", () => {
    const actions1 = generate([
      [1, "q1"],
      [1, "q2"],

      [2, "q1"],
      [2, "q2"],

      [3, "q2"],

      [4, "q1"],
    ]);
    expect(Suggestion.analyse(actions1)).toMatchSnapshot();

    const actions2 = generate([
      [1, "q1"],
      [1, "q2"],
      [2, "q1"],
    ]);
    expect(Suggestion.analyse(actions2)).toMatchSnapshot();
  });
});
