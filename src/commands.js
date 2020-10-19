import { setWeek } from "date-fns";
import * as fs from "fs";

import { analyse as queryAnalysis } from "./analysis/queries";
import { analyse as visitAnalysis } from "./analysis/visits";
import { esClient, LOG_INDEX } from "./esConf";
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

const runWeeklyReportByDate = async (date) => {
  const lastMonday = new Date(date.setDate(date.getDate() - date.getDay() + 1));
  const logFiles = getLastDays(7, lastMonday);
  const dataframe = await Reader.countVisits(esClient, LOG_INDEX, logFiles);

  const report = visitAnalysis(dataframe);
  console.log(report);
  // TODO
  // save report
  console.log(report);
};

export const runWeeklyReport = async (week, year) => {
  const weekDate = setWeek(new Date(year, 1, 1, 12), week + 1);
  runWeeklyReportByDate(weekDate);
};

export const runLastWeeklyReport = async () => {
  const today = new Date();
  runWeeklyReportByDate(today);
};

export const runMonthlyReport = async (month, year) => {
  var date = new Date(year, month - 1, 1, 12);
  var days = [];
  while (date.getMonth() === month - 1) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  const logFiles = days.map(formatDate);
  const dataframe = await Reader.countVisits(esClient, LOG_INDEX, logFiles);

  const report = visitAnalysis(dataframe);
  // TODO
  // save report
  console.log(report);
};

export const runLastMonthlyReport = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  runMonthlyReport(month, year);
};
