import * as path from "path";

import result from "../../__tests__/__fixtures__/2020-04-24-covisits.json";
import { logfile, LOGS_TEST_INDEX, wait } from "../../__tests__/util";
import * as elastic from "../../es/elastic";
import { ingest } from "../../ingestion/ingester";
import * as Reader from "../logReader";

const dumpfile = path.join(
  __dirname,
  "../../__tests__/__fixtures__/2020-04-24.json"
);

const index = `${LOGS_TEST_INDEX}-${Number(Date.now())}`;

test("read data from file", async () => {
  const data = await Reader.readFromFile(logfile);
  expect(data.count()).toBeGreaterThan(0);
});

test("read data from Elastic", async () => {
  await ingest(dumpfile, index);
  await wait(2000);
  const data = await Reader.readFromElastic(index, new Date("2020-04-25"), 1);
  // kept here to recreate local data export
  //*
  // data.asCSV().writeFileSync("/Users/remim/tmp/logs.csv");
  // */

  const searchCC = JSON.parse(data.toJSON());
  expect(searchCC.length).toEqual(result.length);
  expect(searchCC).toEqual(result);
}, 30000);

afterAll(async () => {
  await elastic.esClient.deleteByQuery({
    body: { query: { match_all: {} } },
    index: index,
  });
  await wait(2000);
});
