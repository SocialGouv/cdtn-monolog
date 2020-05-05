// FIXME ES import and management should be improved
import * as es from "../elastic";
import { esClient } from "../esConf";

import { wait, readLogfile } from "./util";
import * as Suggestion from "../analysis/suggestion";
import * as ReportStore from "../reportStore";
// import * as Covisit from "../analysis/covisit";
import * as Queries from "../queries";

const index = "test-query-lib";

const suggestions = [];

beforeAll(async () => {
  // we create index, read test data, run analysis and store reports
  await es.testAndCreateIndex(esClient, index, {});
  await wait(2000);
  const data = await readLogfile();
  const reports = Suggestion.analyse(data);
  suggestions.push(...reports);
  ReportStore.saveReport(esClient, index, suggestions);
});

describe("Query lib", () => {
  // test accessing suggestions with weight
  it("should read suggestions", async () => {
    try {
      const storedSuggestions = await Queries.getSuggestions(esClient, index);

      expect(storedSuggestions.length).toBe(suggestions.length);
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  });

  // test accessing popularity reports
  // test accessing covisits from url
});

afterAll(
  async () =>
    await esClient.deleteByQuery({ index, body: { query: { match_all: {} } } })
);
