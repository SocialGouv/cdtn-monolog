import * as Reader from "../reader";
import * as Suggestion from "../analysis/suggestion";

// const logFile = "/Users/remim/tmp/logs-30.csv";
const logFile = "/Users/remim/tmp/logs-3.csv";

const main = async () => {
  const data = await Reader.readFromElastic(1, new Date());
  data.asCSV().writeFileSync(logFile);

  // const data = await Reader.readFromFile(logFile);
  const suggestions = Suggestion.analyse(data);

  console.log(JSON.stringify(suggestions, null, 1));
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.log(err));
