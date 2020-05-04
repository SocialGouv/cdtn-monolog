// test reports are saved properly
import { wait, logfile } from "./util";
import * as Covisit from "../analysis/covisit";
import * as Reader from "../reader";
import * as ReportStore from "../reportStore";
import * as es from "../elastic";

import { esClient } from "../esConf";

const getAnalysis = async () =>
  Reader.readFromFile(logfile).then((d) => Covisit.analyse(d));

const index = "fake-reports";

beforeAll(async () => {
  await es.testAndCreateIndex(index, Covisit.mappings);
  await wait(2000);
});

test("should properly store reports", async () => {
  const docs = await getAnalysis();
  expect(docs.length).toBe(62);

  const res = await ReportStore.saveReport(index, docs);
  await wait(8000);
  expect(res).toBe(0);
}, 10000);

test("should properly read reports", async () => {
  const reports = await ReportStore.loadReport(index, Covisit.query);
  const docs = await getAnalysis();

  expect(reports.length).toBe(docs.length);
  // expect(reports).toStrictEqual(docs);
});

afterAll(async () => {
  await esClient.deleteByQuery({ index, body: { query: { match_all: {} } } });
});
