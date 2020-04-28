// test reports are saved properly
import { Dataset } from "../dataset";
import { logfile } from "./util";
import * as Covisit from "../analysis/Covisit";
import * as Reader from "../reader";
import * as reportStore from "../reportStore";
import * as es from "../elastic";

jest.mock("../reportStore");

const getAnalysis = async () =>
  Reader.readFromFile(logfile)
    .then((d) => Dataset(d))
    .then((d) => Covisit.analyse(d));

const index = "fake-reports";

test("should properly store reports", async () => {
  const docs = await getAnalysis();
  reportStore.saveReport.mockResolvedValue(0);
  const res = await reportStore.saveReport(docs, Covisit.mappings, index);
  expect(res).toBe(0);
});

test("should properly read reports", async () => {
  const [doc] = await getAnalysis();
  reportStore.loadReport.mockResolvedValue(doc);
  const rep = await reportStore.loadReport(Covisit.mapReport);
  expect(rep).toBe(doc);
});
