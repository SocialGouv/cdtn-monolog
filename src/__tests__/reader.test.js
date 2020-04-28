// test reading is ok
import { logfile } from "./util";
import * as Reader from "../reader";
import { esClient } from "../elastic";

test("read data from file", async () => {
  const data = await Reader.readFromFile(logfile);
  expect(data.count()).toBeGreaterThan(0);
});

test("read data from Elastic", async () => {
  // todo use ES mock
  const data = await Reader.readFromElastic(
    esClient,
    2,
    new Date("2020-03-22")
  );
  expect(data.count()).toBeGreaterThan(0);
}, 20000);
