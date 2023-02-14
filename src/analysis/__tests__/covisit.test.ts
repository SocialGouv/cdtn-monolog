// unitish test for covisit
import { DataFrame, IDataFrame } from "data-forge";

import * as util from "../../reader/readerUtil";
import * as Covisit from "../covisit";

describe("Covisit", () => {
  const toVisitAction = (uvi: number, url: string) => ({
    type: util.actionTypes.visit,
    url,
    uvi,
  });

  const url = (i: number) => `url${i}`;

  const analyse = (dataset: IDataFrame) => Covisit.analyse(dataset, 1, 3, "42");

  // takes tuples and generate data : [1,3] =>  visit id 1 / content viewed 3
  const generate = (a: number[][]) => new DataFrame(a.map(([uvi, u]) => toVisitAction(uvi, url(u))));

  it("should only count unique visits", () => {
    const data = [
      [1, 1],
      [1, 1],
      [1, 2],
    ];

    const df = generate(data);
    expect(analyse(df)).toMatchSnapshot();
  });

  it("should link covisits", () => {
    const data = [
      [1, 1],
      [1, 2],
      [1, 3],

      [2, 1],
      [2, 3],

      [3, 2],
      [3, 3],

      [4, 1],
      [4, 3],
    ];
    const df = generate(data);
    expect(analyse(df)).toMatchSnapshot();
  });

  it("should respect minimum occurences setting", () => {
    const rawMinOcc = [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ];
    const dataMinOcc = generate(rawMinOcc);

    // try with minoccurence 2
    expect(Covisit.analyse(dataMinOcc, 2, 2, "42")).toMatchSnapshot();

    // try with minoccurence 3
    expect(Covisit.analyse(dataMinOcc, 3, 2, "42")).toStrictEqual([]);
    // add content so it passes limitation
    [
      [3, 1],
      [3, 2],
    ].forEach((a) => rawMinOcc.push(a));
    expect(Covisit.analyse(generate(rawMinOcc), 3, 2, "42")).toMatchSnapshot();
  });

  it("should respect link limit setting", () => {
    const linkLimit = generate([
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 1],
      [3, 2],
      [3, 3],
    ]);

    // try with link limit 2
    expect(Covisit.analyse(linkLimit, 1, 2, "42")).toMatchSnapshot();

    // try with link limit 3
    expect(Covisit.analyse(linkLimit, 1, 1, "42")).toMatchSnapshot();
  });
});
