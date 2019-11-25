import * as rp from "request-promise-native";
import { promises as fs } from "fs";
import commander from "commander";
import { commaSeparatedList } from "./utils";

const dumpDay = (path, date) => {
  const url = `https://matomo.tools.factory.social.gouv.fr/index.php?module=API&method=Live.getLastVisitsDetails&idSite=4&period=day&date=${date}&format=JSON&token_auth=anonymous&filter_limit=-1`;
  rp.get({ uri: url }).then(json => {
    const output = `${path}/${date}-log.json`;
    console.log(`Writting logs for ${date} in ${output}`);
    fs.writeFile(output, json);
  });
};

const monolog = new commander.Command();

monolog
  .option(
    "-p, --path <path>",
    "Output path",
    "/Users/remim/data/cdtn-logs/daily"
  )
  .requiredOption(
    "-d, --days <days>",
    "Days to dump from Matomo, separated by commas, example : -d 2019-11-19,2019-11-20",
    commaSeparatedList
  );

monolog.parse(process.argv);

Promise.all(monolog.days.map(day => dumpDay(monolog.path, day))).catch(err =>
  console.log(err)
);
