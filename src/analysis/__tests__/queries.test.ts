import { readCache } from "../../cdtn/resultCache";
import { readFromFile } from "../../reader/logReader";
import { analyse } from "../queries";

describe("Query reports", () => {
  const logPath = "/Users/remim/tmp/queries-test-logs.csv";
  const cachePath = "/Users/remim/tmp/cache-test.csv";

  it("generate query reports", async () => {
    const dataset = await readFromFile(logPath);
    const cache = await readCache(cachePath);
    const reports = analyse(dataset, cache, new Set(["apprentissage"]), 42);

    expect(reports).toMatchSnapshot();
  }, 10000);
});
