import { ConnectionError } from "@elastic/elasticsearch/lib/errors";
import * as yargs from "yargs";

import {
  runIngestion,
  runMonthlyReport,
  runQueryAnalysis,
  runWeeklyReport,
} from "./commands";
import { ELASTICSEARCH_URL } from "./esConf";
import { logger } from "./logger";

const main = async () => {
  try {
    await yargs
      .scriptName("monolog")
      .usage("$0 <cmd> args")
      .command(
        "ingest",
        "Ingest log data from Matomo dumps",
        async () => await runIngestion()
      )
      .command(
        "covisites [days]",
        "Compute covisites",
        {
          days: {
            alias: "d",
          },
        },
        ({ days }) => console.log(`running covisites analysis for ${days} days`)
      )
      .command(
        "queries [days]",
        "Compute query reports",
        {
          days: {
            alias: "d",
          },
        },
        ({ days }) => runQueryAnalysis(days)
      )
      .command("monthly", "Compute monthly report", () => runMonthlyReport())
      .command("weekly", "Compute weekly report", () => runWeeklyReport())
      .demandCommand()
      // .strict()
      .help().argv;
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
