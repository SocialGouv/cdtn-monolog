import { DataFrame } from "data-forge";

import * as util from "../../util";
import * as Popularity from "../popularity";

describe("Popularity", () => {
  // FIXME : move as duplicated with covisit
  const toVisitAction = (uvi, url, timestamp) => ({
    timestamp,
    type: util.actionTypes.visitType,
    url,
    uvi,
  });
  const url = (i) => `url${i}`;

  // one day in seconds
  const sDay = 60 * 60 * 24;

  // get date for today - n days
  const getTimestamp = (n) =>
    Math.floor(new Date(new Date().getTime() - n * sDay).getTime());

  const generate = (a) =>
    new DataFrame(a.map(([uvi, u, ts]) => toVisitAction(uvi, url(u), ts)));

  // takes triples and generate data : [1,3,2] =>  visit id 1 at date 2 days ago / content viewed 3
  const generateWithDays = (a) =>
    generate(a.map(([uvi, u, n]) => [uvi, u, getTimestamp(n)]));

  it("should use unique views per visit", () => {
    const actions = generateWithDays([
      [1, 1, 1],
      [1, 1, 1],
      [1, 2, 1],

      [2, 1, 1],
      [2, 2, 1],

      [3, 1, 10],
      [3, 1, 10],
      [3, 2, 10],
    ]);
    // console.log(actions.toString());

    // we ensure that count are ok for focus and reference periods for url1
    const res = Popularity.analyse(actions, 0.2, 42).filter(
      (r) => r.doc.url == url(1)
    )[0].doc;
    expect(res.ref_count).toBe(1);
    expect(res.focus_count).toBe(2);
  });

  it("should respect proportion between reference and focus period", () => {
    const actions = generateWithDays([
      // visit 11 = visit 1 for days -1
      // visit 21 = visit 2 for days -1
      [11, 1, 1],
      [11, 2, 1],
      [21, 1, 1],
      [21, 2, 1],

      // visit 12 = visit 1 for days -2
      [12, 1, 2],
      [12, 2, 2],
      [22, 1, 2],
      [22, 2, 2],

      [13, 1, 3],
      [13, 2, 3],
      [23, 1, 3],
      [23, 2, 3],
    ]);

    // we ensure that count are ok for focus and reference periods for url1
    const reports1 = Popularity.analyse(actions, 0.3, 43);
    const res1 = reports1.filter((r) => r.doc.url == url(1))[0].doc;
    expect(res1.ref_count).toBe(4);
    expect(res1.focus_count).toBe(2);
    expect(res1).toMatchSnapshot();

    // and using a different split
    const reports2 = Popularity.analyse(actions, 0.7, 44);
    const res2 = reports2.filter((r) => r.doc.url == url(1))[0].doc;
    expect(res2.ref_count).toBe(2);
    expect(res2.focus_count).toBe(4);
    expect(res2).toMatchSnapshot();
  });

  it("should generate report as expected, including dates", () => {
    const end = Math.floor(1588608172467 / 1000);
    const start = end - 10 * sDay;
    const actions = generate([
      [21, 1, end],
      [12, 1, end - sDay],
      [22, 1, end - sDay],
      [13, 1, start],
      [23, 1, start],
    ]);

    // we ensure that count are ok for focus and reference periods for url1
    const report1 = Popularity.analyse(actions, 0.3, 45)[0];
    expect(report1).toMatchSnapshot();
    expect(report1.end).toBe(end);
    expect(report1.start).toBe(start);
    expect(report1.pivot).toBe(start + 0.7 * (end - start));
  });
});
