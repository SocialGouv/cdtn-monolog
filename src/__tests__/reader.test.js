// test reading is ok
import { logfile } from "./util";
import * as Reader from "../reader";

test("read data from file", async () => {
  const data = await Reader.readFromFile(logfile);
  expect(data.count()).toBeGreaterThan(0);
});

test("read data from Elastic", async () => {
  const data = await Reader.readFromElastic(1, new Date("2020-03-22"));
  // kept here to recreate local data export
  //*
  // data.asCSV().writeFileSync("/Users/remim/tmp/logs.csv");
  // */

  expect(data.count()).toBeGreaterThan(0);
}, 30000);
