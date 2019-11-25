import * as logstashClient from "./logstash/logstashClient";
import { promises as fs } from "fs";
import commander from "commander";

export const writeSearches = out => {
  return logstashClient.getRequests().then(res => {
    // we deduplicate searches in visits using stringify (cannot specify equality function for set)
    const dedup = new Set(
      res.map(r => JSON.stringify({ query: r.query, idVisit: r.idVisit }))
    );
    const array = Array.from(dedup).map(JSON.parse);
    fs.writeFile(out, JSON.stringify(array), "utf8");
  });
};

export const writeSteps = async (n, out) => {
  const actions = await logstashClient.scrollSteps();
  // return logstashClient
  // .scrollSteps()
  // .then(actions => fs.writeFile(out, JSON.stringify(actions)));

  return fs
    .writeFile(out, JSON.stringify(actions))
    .then(() => console.log(`${actions.length} actions written in ${out}`));
};

const monolog = new commander.Command();

monolog
  .option("-o, --output <output>", "Output file", "export.json")
  .requiredOption("-c, --content <content>", "Content type : search, action")
  .option(
    "-l, --limit <limit>",
    "Only applicable to action content, limit number of logs",
    1000
  );

monolog.parse(process.argv);

if (monolog.content == "search")
  writeSearches(monolog.output).catch(err => console.log(err));
else if (monolog.content == "action")
  writeSteps(monolog.limit, monolog.output).catch(err =>
    console.log(err.meta.body.error)
  );
else console.log("Unrecognized content type " + monolog.content);
