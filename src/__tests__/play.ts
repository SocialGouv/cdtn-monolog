import { DataFrame } from "data-forge";
import { some } from "fp-ts/lib/Option";
import * as fs from "fs";
import * as readline from "readline";

import { analyse, countQueries } from "../analysis/popularity";
import { analyse as analyseQueries } from "../analysis/queries";
import { Report } from "../analysis/reports";
import { analyse as visitAnalysis } from "../analysis/visits";
import { readCache } from "../cdtn/resultCache";
import { LOG_INDEX, MONTHLY_REPORT_INDEX, REPORT_INDEX } from "../es/elastic";
import { getVisits, toUniqueSearches } from "../reader/dataset";
import { countVisits, readFromFile } from "../reader/logReader";
import { actionTypes, getDaysInPrevMonth, getLastMonthsComplete } from "../reader/readerUtil";
import { queryReportMappings, resetReportIndex, saveReport } from "../report/reportStore";

const readSuggestions = async () => {
  const entities: string[] = [];

  const promiseStream = new Promise<void>((resolve) => {
    const stream = readline.createInterface({
      input: fs.createReadStream("./suggestions.txt"),
    });

    let suggestionsBuffer: any[] = [];
    stream.on("line", async function (line) {
      // parse JSON representing a suggestion entity {entity: suggestion, value: weight}
      const entity = JSON.parse(line);
      suggestionsBuffer.push(entity);
      if (suggestionsBuffer.length >= 2048) {
        // create an immutable copy of the array
        const suggestions = suggestionsBuffer.slice();
        suggestionsBuffer = [];
        suggestions.forEach((s) => entities.push(s));
      }
    });

    stream.on("close", async function () {
      if (suggestionsBuffer.length > 0) {
        suggestionsBuffer.forEach((s) => entities.push(s));
        resolve();
      }
    });
  });

  await promiseStream;
  // console.log(entities.slice(0, 10));
  return entities;
};

const getLogs = async () => {
  /*
  const days = getLastMonthsComplete();
  console.log(days);
  const data = await readDaysFromElastic(LOG_INDEX, days.flat(), [
    actionTypes.search,
    actionTypes.visit,
    actionTypes.selectResult,
    actionTypes.feedback,
  ]);
  // kept here to recreate local data export
  //   data.asCSV().writeFileSync("/Users/remim/tmp/queries-test-logs.csv");
  data.asCSV().writeFileSync("./logs-sept-oct-nov.csv");
  */

  const [m0, m1, m2] = getLastMonthsComplete();

  const data = await readFromFile("./01-2021.csv");
  const cache = await readCache("./cache-01-2021.json");

  const visits = getVisits(data);
  // so we use toArray for now
  const uniqueSearches = DataFrame.concat(visits.select((visit) => toUniqueSearches(visit)).toArray());

  const filtered = data
    .where((r) => m1.includes(r.logfile) && r.type == "search" && r.query == "amiante")
    .distinct((r) => r.idVisit)
    .head(10);

  const november = uniqueSearches.where((r) => m1.includes(r.logfile));

  const am = data.where((r) => m1.includes(r.logfile) && r.query == "amiante");

  const am2 = uniqueSearches
    .where((r) => m1.includes(r.logfile) && r.query.toLowerCase() == "amiante")
    .distinct((r) => r.idVisit);

  const count = countQueries(november, some(cache), new Map<number, string>());
  console.log(am.count());
  console.log(am2.count());

  /*
  console.log(count.where((r) => r.field == "amiante").toString());
  console.log(count.toString());
  console.log(count.where((r) => r.field == "amiante").toString());
  */

  // const data = await readFromFile("./");

  /*
  const visits = getVisits(data);
  const uniqueSearches = DataFrame.concat(
    visits.select((visit) => toUniqueSearches(visit)).toArray()
  );

  const cache = await buildCache(uniqueSearches, 2);
  await persistCache(cache, "./cache-sept-oct-nov.csv");
  */
};

const monthlyRun = async () => {
  const [m0, m1, m2] = getLastMonthsComplete();

  const data = await readFromFile("./logs-sept-oct-nov.csv");
  const cache = await readCache("./cache-sept-oct-nov.csv");

  const contentPop = analyse(data, m0, m1, m2, "1220", "CONTENT");
  const conventionPop = analyse(data, m0, m1, m2, "1220", "CONVENTION");
  const queryPop = analyse(data, m0, m1, m2, "1220", "QUERY", some(cache));

  const suggestions = await readSuggestions();
  const queryReports = analyseQueries(data, cache, new Set(suggestions), "1220");

  //   await resetReportIndex(MONTHLY_REPORT_INDEX, standardMappings);

  await saveReport(REPORT_INDEX, [...contentPop, ...conventionPop, ...queryPop]);

  const queryReportIndex = "log_reports_queries";
  await resetReportIndex(queryReportIndex, queryReportMappings);
  // await saveReport(queryReportIndex, queryReports);

  const month = 11;
  const year = 2020;
  const logFiles = getDaysInPrevMonth(month, year);
  const dataframe = await countVisits(LOG_INDEX, logFiles);

  // TODO we cast for now, we should change report type and id to respect Report type
  const report = visitAnalysis(dataframe, `monthly-${month}-${year}`) as unknown as Report;

  await saveReport(MONTHLY_REPORT_INDEX, [report]);
};

const playQueries = async () => {
  const data = await readFromFile("./logs-sept-oct-nov.csv");
  const cache = await readCache("./cache-sept-oct-nov.csv");

  const suggestions = await readSuggestions();
  const queryReports = analyseQueries(data, cache, new Set(suggestions), "1220");

  const queryReportIndex = "log_reports_queries";
  await resetReportIndex(queryReportIndex, queryReportMappings);
  // await saveReport(queryReportIndex, queryReports);
};

const feedback = async () => {
  const data = await readFromFile("./logs-sept-oct-nov.csv");
  const logFiles = getDaysInPrevMonth(11, 2020);

  const fb = data.where((a) => a.type == actionTypes.feedback).where((a) => logFiles.includes(a.logfile));

  const p = fb.where((a) => a.feedbackType == "positive").count();
  const t = fb.count();
  console.log(p / t);
};

getLogs().then(() => console.log("done."));
