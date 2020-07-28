// FIXME ES import and management should be improved
import { defaultAnalysis } from "../analysis/default";
import * as Suggestion from "../analysis/suggestion";
import { esClient } from "../esConf";
import { Queries } from "../queries";
import * as ReportStore from "../reportStore";
import { readLogfile, wait } from "./util";

const index = "test-query-lib";

const reports = [];

const queries = Queries(esClient, index);

beforeAll(async () => {
  // we create index, read test data, run analysis and store reports
  await ReportStore.resetReportIndex(esClient, index);
  await wait(4000);
  const data = await readLogfile();
  const defaultReports = await defaultAnalysis(data);
  reports.push(...defaultReports);
  ReportStore.saveReport(esClient, index, reports);
  await wait(4000);
}, 20000);

describe("Query lib", () => {
  // test accessing suggestions with weight
  it("should read suggestions", async () => {
    const storedSuggestions = await queries.getSuggestions();
    const suggestions = reports.filter(
      (r) => r.reportType == Suggestion.reportType
    );
    expect(storedSuggestions.length).toBe(suggestions.length);
  });

  // test accessing covisits from url
  it("should access covisit links", async () => {
    const testContent = "modeles-de-courriers/demande-de-paiement-de-salaire";
    const report = await queries.getCovisitLinks(testContent);
    expect(report).toBeDefined();
    const r = reports.filter((r) => r.content == testContent)[0];
    expect(report).toStrictEqual(r);
  });

  it("should throw error for covisit with fake content", () => {
    return expect(queries.getCovisitLinks("fake content")).rejects.toThrow();
  });
});

afterAll(
  async () =>
    await esClient.deleteByQuery({ body: { query: { match_all: {} } }, index })
);
