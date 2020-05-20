import { esClient } from "../esConf";
import * as elastic from "../elastic";
import { ingest } from "../ingestion/ingester";
import { mappings } from "../ingestion/mappings";
import { wait, LOGS_TEST_INDEX, dumpfile } from "./util";

const index = LOGS_TEST_INDEX;

beforeAll(async () => {
  // init and wait in case index does not exist yet
  await elastic
    .deleteIfExists(esClient, index)
    .then(() => elastic.testAndCreateIndex(esClient, index, mappings));
  await esClient.deleteByQuery({ index, body: { query: { match_all: {} } } });
  await wait(5000);
}, 10000);

// test that the ingestion of fake matomo dump is ok
test("ingest Matomo dump to ES", async () => {
  await ingest(esClient, dumpfile, index);
  await wait(2000);
  const resp = await esClient.count({ index });
  expect(resp.body.count).toBe(299);

  const docs = await elastic.getDocuments(esClient, index, { match_all: {} });
  expect(docs).toMatchSnapshot();
});

afterAll(async () => {
  await esClient.deleteByQuery({ index, body: { query: { match_all: {} } } });
  await wait(2000);
});
