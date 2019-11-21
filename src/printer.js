import * as stepper from "./stepper";
import * as logstashClient from "./logstash/logstashClient";

import commander from "commander";

const monolog = new commander.Command();

function commaSeparatedList(value) {
  return value.split(",").map(i => parseInt(i));
}

monolog
  .option("-t, --type <type>", "Visit type : all, suggestion, search", "all")
  .option("-n, --nvisits <n>", "Random n visits", parseInt, 10)
  .option(
    "-i, --ids <ids>",
    "Comma separated list of specific visit ids",
    commaSeparatedList,
    []
  );

monolog.parse(process.argv);

const allowedTypes = {
  search: [stepper.selectResStep, stepper.searchStep],
  suggestion: [stepper.selectSuggStep]
};

const printVisits = (visitIds, logType) =>
  // make all search calls
  Promise.all(visitIds.map(stepper.formatVisit))
    // filter depending on types
    .then(allTypes =>
      allTypes.map(visit =>
        visit.filter(log => {
          if (Object.keys(allowedTypes).includes(logType)) {
            return allowedTypes[logType].includes(log.type);
          } else {
            return true;
          }
        })
      )
    )
    // discard empty visits
    .then(visits => visits.filter(v => v.length > 0))
    // add fake log for speration between visits
    .then(visits => visits.reduce((acc, curr) => acc.concat(curr, {}), []))
    // flatten them
    .then(visits => visits.flat())

    .then(table =>
      console.table(table, [
        "idVisit",
        "type",
        "timeSpentPretty",
        "param1",
        "param2",
        "param3"
      ])
    );

const getVisits = command => {
  if (command.ids.length != 0) {
    return Promise.resolve(command.ids);
  } else {
    return logstashClient.getRandomVisitIds(command.nvisits);
  }
};

getVisits(monolog)
  .then(ids => printVisits(ids, monolog.type))
  .catch(err => console.log(err));
