import { esClient, LOG_INDEX } from "../es/elastic";
import { LogQueries } from "../logQueries";
import { wait } from "./util";
import { ingest } from "../ingestion/ingester";
import { readDaysFromElastic } from "../reader/logReader";
import { actionTypes } from "../reader/readerUtil";

import result from "./__fixtures__/2020-04-24-covisits.json";

const index = "test-query-lib";

const queries = LogQueries(esClient, index);

beforeAll(async () => {
  await ingest("src/__tests__/__fixtures__/2020-04-24.json", LOG_INDEX);
  await wait(1000);
}, 20000);

describe("Query lib", () => {
  it("readDaysFromElastic should returns logs", async () => {
    const data = await readDaysFromElastic(
      LOG_INDEX,
      ["2020-04-24"],
      [actionTypes.searchCC]
    );
    const searchCC = JSON.parse(data.toJSON());
    expect(searchCC.length).toEqual(result.length);
    expect(searchCC).toEqual(result);
  });

  it("should throw error for covisit with fake content", () => {
    return expect(queries.getCovisitLinks("fake content")).rejects.toThrow();
  });
});

afterAll(async () => {
  await esClient.deleteByQuery({
    body: { query: { match_all: {} } },
    index: LOG_INDEX,
  });
});
