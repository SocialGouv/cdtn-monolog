// unitish test for covisit
import * as Covisit from "../covisit";
import * as util from "../../util";
import { DataFrame } from "data-forge";

describe("Covisit", () => {
  const toVisitAction = (uvi, url) => ({
    uvi,
    url,
    type: util.actionTypes.visitType,
  });

  const url = (i) => `url${i}`;

  const analyse = Covisit.analyseNoConf(1, 3);

  // takes tuples and generate data : [1,3] =>  visit id 1 / content viewed 3
  const generate = (a) =>
    new DataFrame(a.map(([uvi, u]) => toVisitAction(uvi, url(u))));

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
    expect(Covisit.analyseNoConf(2, 2)(dataMinOcc)).toMatchSnapshot();

    // try with minoccurence 3
    expect(Covisit.analyseNoConf(3, 2)(dataMinOcc)).toStrictEqual([]);
    // add content so it passes limitation
    [
      [3, 1],
      [3, 2],
    ].forEach((a) => rawMinOcc.push(a));
    expect(Covisit.analyseNoConf(3, 2)(generate(rawMinOcc))).toMatchSnapshot();
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
    expect(Covisit.analyseNoConf(1, 2)(linkLimit)).toMatchSnapshot();

    // try with link limit 3
    expect(Covisit.analyseNoConf(1, 1)(linkLimit)).toMatchSnapshot();
  });
});
