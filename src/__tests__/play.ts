import { buildCache, persistCache } from "../cdtn/resultCache";
import { LOG_INDEX } from "../es/elastic";
import { readFromElastic } from "../reader/logReader";
import { actionTypes } from "../reader/readerUtil";

const getLogs = async () => {
  const data = await readFromElastic(LOG_INDEX, new Date("2020-11-25"), 2, [
    actionTypes.search,
    actionTypes.visit,
    actionTypes.selectResult,
  ]);
  // kept here to recreate local data export
  data.asCSV().writeFileSync("/Users/remim/tmp/queries-test-logs.csv");

  const cache = await buildCache(data, 2);
  await persistCache(cache, "/Users/remim/tmp/cache-test.csv");
};

getLogs().then(() => console.log("done"));
