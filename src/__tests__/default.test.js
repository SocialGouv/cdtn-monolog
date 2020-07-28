// test analysis are stable on actual data
import { defaultAnalysis } from "../analysis/default";
import * as Reader from "../reader";
import { logfile } from "./util";

// assigned in before all (is there a better way to do this ?)
let testDataset = null;

beforeAll(async () => {
  testDataset = await Reader.readFromFile(logfile);
});

describe("Default analysis", () => {
  it("should match snapshots on actual data", async () => {
    const reports = await defaultAnalysis(testDataset, 42);

    const counts = reports.reduce((acc, e) => {
      const rt = e.reportType;
      if (!acc.has(rt)) {
        acc.set(rt, 0);
      }
      acc.set(rt, acc.get(rt) + 1);
      return acc;
    }, new Map());
    expect([counts, reports]).toMatchSnapshot();
  });
});
