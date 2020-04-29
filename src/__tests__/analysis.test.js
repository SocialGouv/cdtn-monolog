// test analysis are corrects
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

test("Covisit analysis", () => {
  expect(Covisit.analyse(testDataset)).toMatchSnapshot();
});

test("Popularity analysis", () => {
  expect(Popularity.analyse(testDataset, 0.8)).toMatchSnapshot();
});

test("Suggestions weigths", () => {
  expect(Suggestion.analyse(testDataset)).toMatchSnapshot();
});
