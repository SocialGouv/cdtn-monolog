// test analysis are stable on actual data
import { logfile } from "./util";
import * as Covisit from "../analysis/covisit";
import * as Popularity from "../analysis/popularity";
import * as Suggestion from "../analysis/suggestion";
import * as Reader from "../reader";

// assigned in before all (is there a better way to do this ?)
let testDataset = null;

beforeAll(async () => {
  testDataset = await Reader.readFromFile(logfile);
});

describe("Covisit analysis", () => {
  it("should match snapshots on actual data", () => {
    expect(Covisit.analyse(testDataset)).toMatchSnapshot();
  });
});

describe("Popularity analysis", () => {
  it("should match snapshots on actual data", () => {
    expect(Popularity.analyse(testDataset, 0.2)).toMatchSnapshot();
  });
});

describe("Suggestions weigths", () => {
  it("should match snapshots on actual data", () => {
    expect(Suggestion.analyse(testDataset)).toMatchSnapshot();
  });
});
