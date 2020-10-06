import * as fs from "fs";

import { analyse as queryAnalysis } from "./analysis/queries";
import { ELASTICSEARCH_URL, esClient, LOG_INDEX, REPORT_INDEX } from "./esConf";
import { checkIndex, ingest } from "./ingestion/ingester";
import { logger } from "./logger";
import * as Reader from "./reader";
import * as ReportStore from "./reportStore";
import { actionTypes, formatDate, getLastDays } from "./util";

export const runIngestion = async (dataPath) => {
  await checkIndex(esClient, LOG_INDEX);
  // read dump files in default location
  fs.readdirSync(dataPath).forEach(async (f) => {
    // convert data
    // save actions to Elastic
    try {
      await ingest(esClient, dataPath + f, LOG_INDEX);
    } catch (err) {
      logger.error(JSON.stringify(err, null, 2));
    }
  });
};

export const runQueryAnalysis = async (period) => {
  const queryReportIndex = "query_reports";

  // we delete the exisiting query reports
  await ReportStore.resetReportIndex(
    esClient,
    queryReportIndex,
    ReportStore.queryReportMappings
  );

  // period should match with latest search update or release ?
  const data = await Reader.readFromElastic(
    esClient,
    LOG_INDEX,
    new Date(),
    period,
    [actionTypes.search, actionTypes.selectResult]
  );

  logger.info("Analysing logs");
  const reports = await queryAnalysis(data);

  // we save the new reports
  await ReportStore.saveReport(esClient, queryReportIndex, reports);
};

export const runMonthlyReport = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() - 1;
  var date = new Date(year, month, 1, 12);
  var days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const logFiles = days.map(formatDate);
  console.log(logFiles);
};

export const runWeeklyReport = async () => {
  const today = new Date();
  const lastMonday = new Date(
    today.setDate(today.getDate() - today.getDay() + 1)
  );
  const logFiles = getLastDays(7, lastMonday);
  console.log(logFiles);
};
