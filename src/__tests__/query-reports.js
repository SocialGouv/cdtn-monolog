// we load the cache

import fs from "fs";
import readline from "readline";

import { esClient, LOG_INDEX, REPORT_INDEX } from "../esConf";
import * as Reader from "../reader";
import {
  queryReportMappings,
  resetReportIndex,
  saveReport,
} from "../reportStore";
import { actionTypes, getLastThreeMonthsComplete } from "../util";

const {
  readCache,
  analyse,
  buildCache,
  writeCache,
} = require("../analysis/queries");

const apiCache = "api-cache.json";

const logFile = "/Users/remim/tmp/3months/logs-aso.csv";

// we retrieve searches and selections
const getLogs = async () => {
  const data = await Reader.readDaysFromElastic(
    esClient,
    LOG_INDEX,
    // 104,
    // new Date("2020-09-12")
    // new Date("2020-11-01"),
    // 50,

    getLastThreeMonthsComplete().flat(),
    [actionTypes.search, actionTypes.selectResult]
    // [actionTypes.selectRelated]
  );

  // we need to unfold the selection field, other asCSV() do not serialize JSON object properly
  const unfolded = data.withSeries({
    resultSelectionAlgo: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.algo : undefined
      ),
    resultSelectionUrl: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.url : undefined
      ),
  });

  unfolded.asCSV().writeFileSync(logFile);
  return data;
};

// we increment the cache

const analysis = async () => {
  // API cache
  //   const cache = await readCache(apiCache);
  const cache = await readCache("./cache-api-aso.json");

  // logs
  //   await getLogs();
  const data = await Reader.readFromFile(logFile);

  const suggestionEntities = await readSuggestions();
  const entities = new Set(suggestionEntities.map((e) => e.entity));

  //   const t = 200;
  //   console.log(data.take(t).toString());

  const reports = analyse(data, 42, cache, entities);

  console.log(JSON.stringify(reports.slice(0, 1), null, 2));

  /*
  const queryReportIndex = "log_reports_queries";
  await resetReportIndex(esClient, queryReportIndex, queryReportMappings);

  await saveReport(esClient, queryReportIndex, reports);
  */
};

const readSuggestions = async () => {
  const entities = [];

  const promiseStream = new Promise((resolve) => {
    const stream = readline.createInterface({
      input: fs.createReadStream("./suggestions.txt"),
    });

    let suggestionsBuffer = [];
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

const cacheManagement = async () => {
  const data = await Reader.readFromFile(logFile);
  const { cache } = await buildCache(data, 5);
  await writeCache(cache, "./cache-api-aso.json");
};

// cacheManagement()
// getLogs()
analysis().then(() => console.log("done"));
