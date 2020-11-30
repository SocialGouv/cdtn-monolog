import { IDataFrame } from "data-forge";
import { some } from "fp-ts/Option";

import { readCache } from "../../cdtn/resultCache";
import { readFromFile } from "../../reader/logReader";
import { getLastMonthsComplete } from "../../reader/readerUtil";
import { analyse, countQueries } from "../popularity";

describe("Query popularity", () => {
  const logPath = "/Users/remim/tmp/queries-test-logs.csv";
  const cachePath = "/Users/remim/tmp/cache-test.csv";

  const log3Months =
    "/Users/remim/dev/cdtn/cdtn-monolog/logs-test-aug-sep-oct.json";

  let dataset: IDataFrame;

  beforeAll(async () => {
    // dataset = await readFromFile(log3Months);
  });

  it("generate query reports", async () => {
    const cache = await readCache(cachePath);
    const days = getLastMonthsComplete(some(new Date()));

    dataset = await readFromFile("./log-searches.csv");

    const reports = analyse(
      dataset,
      days[0],
      days[1],
      days[2],
      44,
      "QUERY",
      some(cache)
    );

    expect(reports).toMatchSnapshot();
  }, 10000);

  /*
  it("generate popularity report for contents", async () => {
    const days = getLastMonthsComplete(some(new Date()));

    const reports = analyse(dataset, days[0], days[1], days[2], 44, "CONTENT");
    expect(reports).toMatchSnapshot();
  });

  it("generate popularity report for conventions collectives", async () => {
    const days = getLastMonthsComplete(some(new Date()));

    const reports = analyse(
      dataset,
      days[0],
      days[1],
      days[2],
      44,
      "CONVENTION"
    );
    expect(reports).toMatchSnapshot();
  });
  */
});
