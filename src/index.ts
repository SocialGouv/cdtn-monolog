import { ConnectionError } from "@elastic/elasticsearch/lib/errors";
import * as yargs from "yargs";

import { reportType } from "./analysis/covisit";
import {
  createCache,
  refreshCovisits,
  retrieveThreeMonthsData,
  runIngestion,
  runMonthly,
  runPrequalifiedCheck,
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
        "queries [data] [cache] [suggestions] [reportId]",
        "Compute query reports",
        {
          cache: { alias: "c", demand: true },
          data: { alias: "d", demand: true },
          reportId: { alias: "i" },
          suggestions: { alias: "s" },
        },
        ({ data, cache, suggestions, reportId }) =>
          runQueryAnalysis(
            data as string,
            cache as string,
            suggestions as string | undefined,
            (reportId as string) || undefined
          )
      )
      .command(
        "prequalified [prequalified] [reportId]",
        "Compute query reports",
        {
          prequalified: { alias: "p", demand: true },
          reportId: { alias: "i", demand: true },
        },
        ({ prequalified, reportId }) =>
          runPrequalifiedCheck(prequalified as string, reportId as string)
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
