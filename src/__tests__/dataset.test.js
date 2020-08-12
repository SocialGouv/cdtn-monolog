import * as DatasetUtil from "../dataset";
import * as Reader from "../reader";
import { logfile } from "./util";

test("access data", async () => {
  const dataframe = await Reader.readFromFile(logfile);
  expect(dataframe.count()).toBe(27015);
  expect(DatasetUtil.getVisits(dataframe).count()).toBe(14656);
});
