import { ConnectionError } from "@elastic/elasticsearch/lib/errors";
import * as fs from "fs";

import { defaultAnalysis } from "./analysis/default";
import { analyse as queryAnalysis } from "./analysis/queries";
import { ELASTICSEARCH_URL, esClient, LOG_INDEX, REPORT_INDEX } from "./esConf";
import { checkIndex, ingest } from "./ingestion/ingester";
import { logger } from "./logger";
import * as Reader from "./reader";
import * as ReportStore from "./reportStore";
import { actionTypes } from "./util";

// running analysis including 30 days before today
const refDate = new Date();
const defaultPeriod = 3;

const runDefaultAnalysis = async () => {
  ReportStore.resetReportIndex(esClient, REPORT_INDEX);
  const data = await Reader.readFromElastic(
    esClient,
    LOG_INDEX,
    refDate,
    defaultPeriod
  );
  const reports = defaultAnalysis(data);
  const res = await ReportStore.saveReport(esClient, REPORT_INDEX, reports);
  return res;
};

const runQueryAnalysis = async (period) => {
  // period should match with latest search update or release ?
  const data = await Reader.readFromElastic(
    esClient,
    LOG_INDEX,
    refDate,
    period,
    [actionTypes.search, actionTypes.selectResult]
  );
  const reports = queryAnalysis(data);
  console.log(reports);
};

// TODO
const runIngestion = async (dataPath) => {
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

// poors man CLI, might move to commander if needed
const ANALYSE = "analyse";
const QUERIES = "queries";
const INGEST = "ingest";

// const command = process.argv[process.argv.length - 1];
const command = process.env.MONOLOG_ACTION;
const main = async () => {
  try {
    if (command == INGEST) {
      logger.info("Running ingestion");
      const dataPath = process.env.DATA ? process.env.DATA : "data/";
      await runIngestion(dataPath);
    } else if (command == ANALYSE) {
      logger.info("Running analysis");
      await runDefaultAnalysis();
    } else if (command == QUERIES) {
      logger.info("Running query analysis");
      await runQueryAnalysis();
    } else {
      logger.error(
        `Unrecognized env variable for MONOLOG_ACTION : ${command}, valid commands are : ${ANALYSE}, ${INGEST}, ${QUERIES}`
      );
      process.exit(1);
    }
  } catch (err) {
    if (err.name != undefined && err.name == ConnectionError.name) {
      logger.error("Cannot access Elastic on URL : " + ELASTICSEARCH_URL);
    } else {
      console.log(err);
      logger.error(JSON.stringify(err, null, 2));
    }
    process.exit(1);
  }
};

main().then(() => {
  logger.info("Done");
});
// .catch((err) => {
// logger.error(err);
// });
