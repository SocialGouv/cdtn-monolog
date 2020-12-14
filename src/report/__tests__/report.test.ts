// test reports are saved properly
import { readLogfile, wait } from "../../__tests__/util";
import * as Covisit from "../../analysis/covisit";
import * as es from "../../es/elastic";
import * as ReportStore from "../reportStore";

const getAnalysis = async () =>
  readLogfile().then((d) => Covisit.analyse(d, 5, 14, "report-42"));

const index = "test-report-store";

beforeAll(async () => {
  await es.testAndCreateIndex(index, {});
  await wait(2000);
});

describe("Report", () => {
  it("should be properly persisted", async () => {
    const docs = await getAnalysis();
    expect(docs.length).toBe(62);

    const res = await ReportStore.saveReport(index, docs);
    await wait(8000);
    expect(res).toBe(0);
  });

  it("should be readable", async () => {
    const reports = await ReportStore.loadReport(index, {
      match_all: {},
    });
    const docs = await getAnalysis();

    expect(reports.docs.length).toBe(docs.length);
    expect(reports.docs).toStrictEqual(docs);
  });
});

afterAll(
  async () =>
    await es.esClient.deleteByQuery({
      body: { query: { match_all: {} } },
      index,
    })
);
