import * as Reader from "../reader";
import { esClient } from "../esConf";
import { LOGS_TEST_INDEX, logfile, dumpfile, wait } from "./util";
import { ingest } from "../ingestion/ingester";

test("read data from file", async () => {
  const data = await Reader.readFromFile(logfile);
  expect(data.count()).toBeGreaterThan(0);
});

test("read data from Elastic", async () => {
  await ingest(esClient, dumpfile, LOGS_TEST_INDEX);
  await wait(2000);
  const data = await Reader.readFromElastic(
    esClient,
    1,
    new Date("2020-04-25"),
    LOGS_TEST_INDEX
  );
  // kept here to recreate local data export
  //*
  // data.asCSV().writeFileSync("/Users/remim/tmp/logs.csv");
  // */

  expect(data.count()).toBeGreaterThan(0);
}, 30000);

afterAll(async () => {
  await esClient.deleteByQuery({
    index: LOGS_TEST_INDEX,
    body: { query: { match_all: {} } },
  });
  await wait(2000);
});
