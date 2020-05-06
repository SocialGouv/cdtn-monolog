import { logger } from "./logger";
import { defaultAnalysis } from "./analysis/default";
import * as Reader from "./reader";
import * as ReportStore from "./reportStore";
import { REPORT_INDEX_PREFIX } from "./esConf";

// running analysis including 30 days before today
const refDate = new Date();
const defaultPeriod = 30;

const runAnalysis = async () => {
  const data = await Reader.readFromElastic(defaultPeriod, refDate);
  const reports = defaultAnalysis(data);
  const res = await ReportStore.saveReport(REPORT_INDEX_PREFIX, reports);
  return res;
};

// TODO
const runIngestion = () => {
  // read dump file in default location
  // convert data
  // save data to Elastic
};

// poors man CLI, might move to commander if needed
const ANALYSE = "analyse";
const INGEST = "ingest";

const command = process.argv[process.argv.length - 1];

const main = async () => {
  if (command == INGEST) {
    logger.info("Running ingestion");
    await runIngestion();
  } else if (command == ANALYSE) {
    logger.info("Running analysis");
    await runAnalysis();
  } else {
    logger.error(
      `Unrecognized command, valid commands are : ${ANALYSE}, ${INGEST}`
    );
    process.exit(1);
  }
};

main()
  .then(() => {
    logger.info("Done");
  })
  .catch((err) => {
    logger.error(err);
  });
