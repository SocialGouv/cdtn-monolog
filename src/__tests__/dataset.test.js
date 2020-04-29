import * as DatasetUtil from "../dataset";
import { logfile } from "./util";
import * as Reader from "../reader";

test("access data", async () => {
  const dataframe = await Reader.readFromFile(logfile);
  expect(dataframe.count()).toBe(298008);
  expect(DatasetUtil.getVisits(dataframe).count()).toBe(7444);
});
