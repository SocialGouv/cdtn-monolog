import { LOG_INDEX } from "../es/elastic";
import { readFromElastic } from "../reader/logReader";
import { actionTypes } from "../reader/readerUtil";

const getLogs = async () => {
  const data = await readFromElastic(LOG_INDEX, new Date("2020-11-25"), 7, [
    actionTypes.search,
    actionTypes.selectResult,
  ]);
  // kept here to recreate local data export
  data.asCSV().writeFileSync("/Users/remim/tmp/queries-test-logs.csv");

  // TODO sort result selection URL
};

getLogs().then(() => console.log("done"));
