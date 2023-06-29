import { logger } from "@socialgouv/cdtn-logger";
import { none, some } from "fp-ts/lib/Option";
import * as fs from "fs";

import { analyse as covisitAnalysis } from "./analysis/covisit";
import { monthlyAnalysis, readDaysAndWriteAllLogs } from "./analysis/kpi";
import { analyse as popularityAnalysis } from "./analysis/popularity";
import { analyse as queryAnalysis, generateAPIResponseReports } from "./analysis/queries";
import { analyse as satisfactionAnalysis } from "./analysis/satisfaction";
import { analyse as visitAnalysis } from "./analysis/visits";
import { buildCache, persistCache, readCache } from "./cdtn/resultCache";
import { readSuggestions } from "./cdtn/suggestions";
import {
  KPI_INDEX,
  LOG_INDEX,
  MONTHLY_REPORT_INDEX,
  QUERY_REPORT_INDEX,
  REPORT_INDEX,
  RESULTS_REPORT_INDEX,
  SATISFACTION_REASONS_INDEX,
  testAndCreateIndex,
} from "./es/elastic";
import { checkIndex, ingest } from "./ingestion/ingester";
import {
  countVisits,
  delay,
  readDaysAndWrite,
  readDaysFromElastic,
  readFromFile,
  readFromFolder,
} from "./reader/logReader";
import { actionTypes, getDaysInPrevMonth, getLastMonthsComplete, removeThemesQueries } from "./reader/readerUtil";
import {
  kpiMappings,
  queryReportMappings,
  resetReportIndex,
  resultReportMappings,
  satisfactionMappings,
  satisfactionReasonsMappings,
  saveReport,
  standardMappings,
} from "./report/reportStore";

// TODO shall we use EitherTask here ?
export const runIngestion = async (dataPath: string): Promise<void> => {
  logger.info(`Running Elastic ingestion for files in ${dataPath}`);

  await checkIndex(LOG_INDEX);
  // read dump files in default location
  fs.readdirSync(dataPath).forEach(async (f) => {
    // convert data
    // save actions to Elastic
    try {
      await ingest(dataPath + f, LOG_INDEX);
    } catch (err) {
      logger.error(JSON.stringify(err, null, 2));
    }
  });
};

export const runQueryAnalysis = async (
  dataPath: string,
  cachePath: string,
  suggestionPath: string | undefined
): Promise<void> => {
  logger.info(
    `Running query analysis using data ${dataPath}, cache ${cachePath} and ${
      suggestionPath ? `suggestions ${suggestionPath}` : "no suggestions file"
    }, saved in Elastic reports`
  );

  const data_raw = await readFromFolder(dataPath);
  const data = removeThemesQueries(data_raw);
  const cache = await readCache(cachePath);
  const suggestions = suggestionPath ? await readSuggestions(suggestionPath as string) : new Set<string>();

  logger.info("Analysing logs");
  const { queries } = await queryAnalysis(data, cache, suggestions);
  const results = generateAPIResponseReports(queries);

  // we delete the exisiting query reports
  //await resetReportIndex(QUERY_REPORT_INDEX, queryReportMappings); now indexed by date
  await resetReportIndex(RESULTS_REPORT_INDEX, resultReportMappings);
  // we save the new reports
  await saveReport(QUERY_REPORT_INDEX, [...queries]);
  await saveReport(RESULTS_REPORT_INDEX, results);
};

export const runMonthly = async (monthPath: string): Promise<void> => {
  logger.info(
    `Running monthly log analysis (monthly counts and popularity reports) using data data-${monthPath} and cache cache-${monthPath}.json, saved in Elastic reports`
  );

  const [m0, m1, m2] = getLastMonthsComplete();
  const data_raw = await readFromFolder(`data-${monthPath}`);
  const data = removeThemesQueries(data_raw);
  console.log("Satisfaction analysis ...");
  const satisfaction = satisfactionAnalysis(data);

  await saveReport("logs-satisfaction", satisfaction.analysis);
  await saveReport(SATISFACTION_REASONS_INDEX, satisfaction.reasons);

  //const data = data_raw;
  const cache = await readCache(`cache-${monthPath}.json`);

  // we use the last analysed month (m0)
  const month = parseInt(m0[0].split("-")[1]);
  const year = parseInt(m0[0].split("-")[0]);

  const reportId = month.toString() + year.toString();

  console.log("Popularity analysis ...");
  console.log("... for content ...");
  const contentPop = popularityAnalysis(data, m0, m1, m2, reportId, "CONTENT");
  console.log("... for convention ...");
  const conventionPop = popularityAnalysis(data, m0, m1, m2, reportId, "CONVENTION");
  console.log("... for query ...");
  const queryPop = popularityAnalysis(data, m0, m1, m2, reportId, "QUERY", some(cache));
  // TODO : delete previous popularity reports
  await resetReportIndex(REPORT_INDEX, standardMappings);
  await delay(60);
  await saveReport(REPORT_INDEX, [...contentPop, ...conventionPop, ...queryPop]);
  await delay(180);

  console.log("Visit analysis ...");
  const logFiles = getDaysInPrevMonth(month, year);
  const dataframe = await countVisits(LOG_INDEX, logFiles);

  const report = visitAnalysis(dataframe, `monthly-${month}-${year}`);

  await saveReport(MONTHLY_REPORT_INDEX, [report]);
};

export const runMonthlyKpi = async (monthPath: string): Promise<void> => {
  const allLogsForLastMonthFolder = `data-all-logs-${monthPath}`;
  logger.info(
    `Running monthly log analysis for KPI rate of completion using data ${allLogsForLastMonthFolder}, saved in Elastic reports`
  );
  logger.info("Monthly KPI analysis ...");
  // TODO : uncomment next line first time
  //await resetReportIndex(KPI_INDEX, kpiMappings);
  const rawData = await readFromFolder(allLogsForLastMonthFolder);
  const kpiReport = monthlyAnalysis(rawData);
  await saveReport(KPI_INDEX, kpiReport);
};

export const retrieveThreeMonthsData = async (output: string): Promise<void> => {
  const daysOfLastThreeMonths = getLastMonthsComplete().flat().sort();
  const daysOfLastMonth = getLastMonthsComplete(none, some(1)).flat().sort();

  logger.info(
    `Retrieve log data for the last three months (${daysOfLastThreeMonths[0]} to ${
      daysOfLastThreeMonths[daysOfLastThreeMonths.length - 1]
    }), saved in data-${output}`
  );

  await readDaysAndWrite(
    LOG_INDEX,
    daysOfLastThreeMonths,
    [
      actionTypes.search,
      actionTypes.visit,
      actionTypes.selectResult,
      actionTypes.selectRelated,
      actionTypes.feedback,
      actionTypes.feedback_category,
      actionTypes.feedback_suggestion,
    ],
    `data-${output}`
  );

  await delay(240);

  logger.info(`Retrieve log data for the last month (${daysOfLastMonth[0]}), saved in data-all-logs-${output}`);
  await readDaysAndWriteAllLogs(LOG_INDEX, daysOfLastMonth, `data-all-logs-${output}`);

  //await data.asCSV().writeFile(output);
};

export const createCache = async (output: string): Promise<void> => {
  logger.info(`Creating cache, saved in ${output}`);
  // const data = await readFromFolder(dataPath);
  const cache = await buildCache();
  await persistCache(cache, output);
};

export const refreshCovisits = async (dataPath: string): Promise<void> => {
  logger.info(`Refreshing covisites using links in data ${dataPath}`);
  const data = await readFromFolder(dataPath);
  const covisitReports = covisitAnalysis(data);

  // TODO : delete previous covisit reports

  await saveReport(REPORT_INDEX, covisitReports);
};

// TODO function to recreate all reports from january 2020
// await ReportStore.resetReportIndex(
//   esClient,
//   MONTHLY_REPORT_INDEX,
//   ReportStore.visitReportMappings
// );

// await ReportStore.resetReportIndex(
//   esClient,
//   WEEKLY_REPORT_INDEX,
//   ReportStore.visitReportMappings
// );

// [...Array(week).keys()].map((w) => {
//   const ww = w + 1;
//   console.log({ week: ww, year });
//   const weekDate = setWeek(new Date(year, 1, 1, 12), ww + 1);
//   runWeeklyReportByDate(weekDate);
// });
