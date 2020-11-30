import { buildCache, persistCache } from "../cdtn/resultCache";
import { LOG_INDEX } from "../es/elastic";
import { readFromElastic } from "../reader/logReader";
import { actionTypes } from "../reader/readerUtil";

const getLogs = async () => {
  const data = await readFromElastic(LOG_INDEX, new Date("2020-11-30"), 95, [
    actionTypes.search,
    // actionTypes.visit,
    // actionTypes.selectResult,
  ]);
  // kept here to recreate local data export
  //   data.asCSV().writeFileSync("/Users/remim/tmp/queries-test-logs.csv");
  data.asCSV().writeFileSync("./log-searches.csv");

  const cache = await buildCache(data, 2);
  await persistCache(cache, "./cache-searches.csv");
};

getLogs().then(() => console.log("done"));
