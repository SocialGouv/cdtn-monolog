import { Dataset } from "../dataset";
import { logfile } from "./util";
import * as Reader from "../reader";

const readTestData = async () => Reader.readFromFile(logfile);

test("access data", async () => {
  const data = await readTestData();
  const dataset = Dataset(data);

  expect(dataset.count()).toBe(18720);
  expect(dataset.getVisits().count()).toBe(6132);
});
