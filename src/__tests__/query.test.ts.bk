// FIXME ES import and management should be improved
import { analyse } from "../analysis/covisit";
import { Report } from "../analysis/reports";
import { esClient } from "../es/elastic";
import { LogQueries } from "../logQueries";
import * as ReportStore from "../report/reportStore";
import { readLogfile, wait } from "./util";

const index = "test-query-lib";

const reports: Report[] = [];

const queries = LogQueries(esClient, index);

beforeAll(async () => {
  // we create index, read test data, run analysis and store reports
  await ReportStore.resetReportIndex(index, ReportStore.standardMappings);
  await wait(4000);
  const data = await readLogfile();
  const defaultReports = await analyse(data);
  reports.push(...defaultReports);
  ReportStore.saveReport(index, reports);
  await wait(4000);
}, 20000);

describe("Query lib", () => {
  // test accessing covisits from url
  it("should access covisit links", async () => {
    const testContent = "modeles-de-courriers/demande-de-paiement-de-salaire";
    const report = await queries.getCovisitLinks(testContent);
    expect(report).toBeDefined();
    const r = reports.filter((r: any) => r.content == testContent)[0];
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
