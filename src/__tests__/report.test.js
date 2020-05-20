// test reports are saved properly
import { wait, readLogfile } from "./util";
import * as Covisit from "../analysis/covisit";
import * as ReportStore from "../reportStore";
import * as es from "../elastic";

import { esClient } from "../esConf";

const getAnalysis = async () => readLogfile().then((d) => Covisit.analyse(d));

const index = "test-report-store";

beforeAll(async () => {
  await es.testAndCreateIndex(esClient, index, {});
  await wait(2000);
});

describe("Report ", () => {
  it("should be properly persisted", async () => {
    const docs = await getAnalysis();
    expect(docs.length).toBe(62);

    const res = await ReportStore.saveReport(esClient, index, docs);
    await wait(8000);
    expect(res).toBe(0);
  }, 10000);

  it("should be readable", async () => {
    const reports = await ReportStore.loadReport(esClient, index, {
      match_all: {},
    });
    const docs = await getAnalysis();

    expect(reports.length).toBe(docs.length);
    expect(reports).toStrictEqual(docs);
  });
});

afterAll(
  async () =>
    await esClient.deleteByQuery({ index, body: { query: { match_all: {} } } })
);
