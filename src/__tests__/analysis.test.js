// test analysis are corrects
import { Dataset } from "../dataset";
import { logfile } from "./util";
import * as Covisit from "../analysis/Covisit";
import * as Reader from "../reader";

const readTestDataset = async () =>
  Reader.readFromFile(logfile).then((d) => Dataset(d));

test("Covisit analysis", async () => {
  const dataset = await readTestDataset();
  expect(Covisit.analyse(dataset)).toStrictEqual([{ count: 6132 }]);
  //   expect(Covisit.mappings).toStrictEqual({});
});
