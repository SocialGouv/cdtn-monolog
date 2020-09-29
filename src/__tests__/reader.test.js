import { esClient } from "../esConf";
import { ingest } from "../ingestion/ingester";
import * as Reader from "../reader";
import { dumpfile, logfile, LOGS_TEST_INDEX, wait } from "./util";

test("read data from file", async () => {
  const data = await Reader.readFromFile(logfile);
  expect(data.count()).toBeGreaterThan(0);
});

test("read data from Elastic", async () => {
  await ingest(esClient, dumpfile, LOGS_TEST_INDEX);
  await wait(2000);
  const data = await Reader.readFromElastic(
    esClient,
    LOGS_TEST_INDEX,
    new Date("2020-04-25"),
    1
  );
  // kept here to recreate local data export
  //*
  // data.asCSV().writeFileSync("/Users/remim/tmp/logs.csv");
  // */

  expect(data.count()).toBeGreaterThan(0);
}, 30000);

afterAll(async () => {
  await esClient.deleteByQuery({
    body: { query: { match_all: {} } },
    index: LOGS_TEST_INDEX,
  });
  await wait(2000);
});
