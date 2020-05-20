// import * as Reader from "../reader";
// import * as Suggestion from "../analysis/suggestion";
import { esClient } from "../esConf";
import { ingest } from "../ingestion/ingester";

// const logFile = "/Users/remim/tmp/logs-30.csv";
// const logFile = "/Users/remim/tmp/logs-3.csv";

const dumpFile = "/Users/remim/tmp/ingest-test/2020-04-23.json";

const main = async () => {
  // const data = await Reader.readFromElastic(esClient, 60, new Date());
  // data.asCSV().writeFileSync(logFile);
  // const data = await Reader.readFromFile(logFile);
  // const suggestions = Suggestion.analyse(data);
  // console.log(JSON.stringify(suggestions, null, 1));

  ingest(esClient, dumpFile, "logs");

  // check index
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.log(err));
