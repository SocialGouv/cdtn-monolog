import * as path from "path";

import { LOGS_TEST_INDEX, wait } from "../../__tests__/util";
import * as elastic from "../../es/elastic";
import { ingest } from "../ingester";
import { mappings } from "../mappings";

const dumpfile = path.join(__dirname, "../../__tests__/__fixtures__/2020-04-24.json");

const index = `${LOGS_TEST_INDEX}-${Number(Date.now())}`;

beforeAll(async () => {
  // init and wait in case index does not exist yet
  await elastic.deleteIfExists(index).then(() => elastic.testAndCreateIndex(index, mappings));
  await elastic.esClient.deleteByQuery({
    body: { query: { match_all: {} } },
    index,
  });
  await wait(5000);
});

// test that the ingestion of fake matomo dump is ok
test("ingest Matomo dump to ES", async () => {
  await ingest(dumpfile, index);
  await wait(2000);
  const resp = await elastic.esClient.count({ index });
  expect(resp.body.count).toBe(299);

  const docs = await elastic.getDocuments(index, { match_all: {} });
  expect(docs).toMatchSnapshot();
});

afterAll(async () => {
  await elastic.deleteIfExists(index);
  await wait(2000);
});
