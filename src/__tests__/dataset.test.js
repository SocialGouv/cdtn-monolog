import * as DatasetUtil from "../dataset";
import { logfile } from "./util";
import * as Reader from "../reader";

test("access data", async () => {
  const dataframe = await Reader.readFromFile(logfile);
  expect(dataframe.count()).toBe(27015);
  expect(DatasetUtil.getVisits(dataframe).count()).toBe(14656);
});
