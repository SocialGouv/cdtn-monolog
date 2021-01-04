import { ConnectionError } from "@elastic/elasticsearch/lib/errors";
import * as yargs from "yargs";

import {
  createCache,
  refreshCovisits,
  retrieveThreeMonthsData,
  runIngestion,
  runMonthly,
  runQueryAnalysis,
} from "./commands";
import { logger } from "./logger";

const main = async () => {
  try {
    await yargs
      .scriptName("monolog")
      .usage("$0 <cmd> args")
      .command(
        "ingest [path]",
        "Ingest log data from Matomo dumps",
        {
          path: {
            alias: "p",
            default: "data/",
          },
        },
        async ({ path }) => await runIngestion(path)
      )
      .command(
        "covisits [days]",
        "Compute covisites",
        {
          data: {
            alias: "d",
            demand: true,
          },
        },
        // TODO
        async ({ data }) => await refreshCovisits(data as string)
      )
      .command(
        "retrieve [output]",
        "Retrieve data for monthly analysis",
        {
          output: {
            alias: "o",
            demand: true,
          },
        },
        ({ output }) => retrieveThreeMonthsData(output as string)
      )
      .command(
        "cache [data] [output]",
        "Generate API cache for searches in [data]",
        {
          data: {
            alias: "d",
            demand: true,
          },
          output: {
            alias: "o",
            demand: true,
          },
        },
        ({ data, output }) => createCache(data as string, output as string)
      )
      .command(
        "queries [data] [cache] [suggestions]",
        "Compute query reports",
        {
          cache: { alias: "c", demand: true },
          data: { alias: "d", demand: true },
          suggestions: { alias: "s" },
        },
        ({ data, cache, suggestions }) =>
          runQueryAnalysis(
            data as string,
            cache as string,
            suggestions as string | undefined
          )
      )
      .command(
        "monthly [data]",
        "Compute monthly reports (visit and popularity)",
        {
          cache: { alias: "c", demand: true },
          data: { alias: "d", demand: true },
        },
        ({ data, cache }) => runMonthly(data as string, cache as string)
      )
      .demandCommand()
      // .strict()
      .help().argv;
  } catch (err) {
    if (err.name != undefined && err.name == ConnectionError.name) {
      logger.error("Cannot access Elastic : " + JSON.stringify(err, null, 2));
    } else {
      console.log(err);
      logger.error(JSON.stringify(err, null, 2));
    }
    process.exit(1);
  }
};

//TODO
main().then(() => {
  logger.info("Started");
});
// .catch((err) => {
// logger.error(err);
// });
