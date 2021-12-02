// Example script to get some specific content to run evaluation or get a grasp on some specific user behavior

import { none, some } from "fp-ts/lib/Option";

import { LOG_INDEX } from "../es/elastic";
import { readDaysFromElastic } from "../reader/logReader";
import { actionTypes, getLastMonthsComplete } from "../reader/readerUtil";

// get cc search
const retrieveData = async () => {
  const days = getLastMonthsComplete(none, some(6)).flat().sort();

  console.log(days);
  const data = await readDaysFromElastic(LOG_INDEX, days, [
    actionTypes.searchCC,
  ]);

  await data.asCSV().writeFile("./cc-search.csv");
};

retrieveData().then(() => console.log("done"));

// To run :
// node -r ts-node/register  src/tests/query_es.ts
