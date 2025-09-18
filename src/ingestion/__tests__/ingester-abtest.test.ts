import * as path from "path";

import { LOGS_TEST_INDEX, wait } from "../../__tests__/util";
import * as elastic from "../../es/elastic";
import { ingest } from "../ingester";
import { mappings } from "../mappings";

const dumpfileAbTesting = path.join(__dirname, "../../__tests__/__fixtures__/ab-testing.json");

const index = `${LOGS_TEST_INDEX}-${Number(Date.now())}`;

describe("Ingester", () => {
  beforeEach(async () => {
    // init and wait in case index does not exist yet
    await elastic.deleteIfExists(index).then(() => elastic.testAndCreateIndex(index, mappings));
    await elastic.esClient.deleteByQuery({
      body: { query: { match_all: {} } },
      index,
    });
    await wait(5000);
  });

  test("ingest A/B Testing Matomo dump to ES", async () => {
    await ingest(dumpfileAbTesting, index);
    await wait(2000);
    const resp = await elastic.esClient.count({ index });
    expect(resp.count).toBe(6);

    const docs = await elastic.getDocuments(index, { match_all: {} });
    const allOk = docs.docs.every(
      (doc) => "abName" in doc && "abVariant" in doc && doc.abName === "Search" && doc.abVariant === "natural"
    );
    expect(allOk).toBe(true);
  });

  afterEach(async () => {
    await elastic.deleteIfExists(index);
    await wait(2000);
  });
});
