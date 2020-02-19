// Script to convert matomo raw logs into the json format required for analysis

import * as fs from "fs";
import * as bjson from "big-json";

// takes a file, return the content properly formatted
const whitelistNames = [
  "idVisit",
  "timestamp",
  "serverTimePretty",
  "referrerTypeName",
  "referrerName",
  "lastActionTimestamp",
  "lastActionDateTime",
  "referrerTypeName",
  "referrerName"
];

const parseAction = (action, visit) => {
  const parsedAction = {};
  parsedAction["timeSpent"] = action["timeSpent"];
  parsedAction["url"] = action["url"];

  whitelistNames.forEach(key => {
    parsedAction[key] = visit[key];
  });

  if (action.type == "search") {
    parsedAction["type"] = "search";
    parsedAction["query"] = action.subtitle;
  } else if (action.type == "action") {
    if (action.url.endsWith("gouv.fr/")) {
      parsedAction["type"] = "home";
    } else if (
      action.url.includes("/themes/") ||
      action.url.endsWith("/themes")
    ) {
      parsedAction["type"] = "themes";
    } else if (action.url.endsWith("/outils")) {
      parsedAction["type"] = "outils";
    } else if (action.url.endsWith("/recherche")) {
      parsedAction["type"] = "external_search";
    } else if (action.url.endsWith("/modeles-de-courriers")) {
      parsedAction["type"] = "modeles_courriers";
    } else if (action.url.includes("?dclid=")) {
      parsedAction["type"] = "unknown";
    } else {
      parsedAction["type"] = "visit_content";
    }
  } else if (action.type == "event") {
    switch (action.eventCategory) {
      case "selectedSuggestion": {
        parsedAction["type"] = "select_suggestion";
        parsedAction["prefix"] = action.eventAction;
        parsedAction["sugg_selection"] = action.eventName;
        break;
      }
      case "feedback": {
        parsedAction["type"] = "feedback";
        parsedAction["feedback_type"] = action.eventAction;
        parsedAction["visited"] = action.eventName;
        break;
      }
      case "candidateSuggestions": {
        parsedAction["type"] = "suggestion_candidates";
        parsedAction["suggestion_candidates"] = action.eventAction.split("###");
        break;
      }
      case "candidateResults": {
        parsedAction["type"] = "result_candidates";
        parsedAction["query"] = action.eventAction;
        parsedAction["result_candidates"] = JSON.parse(action.eventName);
        break;
      }
      case "selectResult": {
        parsedAction["type"] = "select_result";
        parsedAction["res_selection"] = JSON.parse(action.eventAction);
        break;
      }
      case "themeResults": {
        parsedAction["type"] = "theme_candidates";
        parsedAction["query"] = action.eventAction;
        parsedAction["result_candidates"] = JSON.parse(action.eventName);
        break;
      }
      default: {
        parsedAction["type"] = action.eventCategory;
        break;
      }
    }
  } else {
    parsedAction["type"] = action.type;
  }

  // correct broken timezone on Matomo server
  parsedAction["timestamp"] = action.timestamp + 28800;

  return parsedAction;
};

const parseVisit = visit => {
  const actions = visit.actionDetails.flatMap(action => {
    const pa = parseAction(action, visit);
    // console.log(pa);
    return pa;
  });

  return actions;
};

export const convertLogs = path => {
  const rawData = fs.readFileSync(path);
  const rawVisits = JSON.parse(rawData);

  return rawVisits.flatMap(visit => {
    // console.log(visit.idVisit);
    return parseVisit(visit);
  });
};

/*
const dates = [
  "2020-02-09",
  "2020-02-08",
  "2020-02-07",
  "2020-02-06",
  "2020-02-05",
  "2020-02-04",
  "2020-02-03",
  "2020-02-02",
  "2020-02-01",
  "2020-01-31",
  "2020-01-30",
  "2020-01-29",
  "2020-01-28",
  "2020-01-22",
  "2020-01-23",
  "2020-01-24",
  "2020-01-25",
  "2020-01-26",
  "2020-01-27",
  "2020-01-21",
  "2020-01-20",
  "2020-01-19",
  "2020-01-18",
  "2020-01-17",
  "2020-01-16",
  "2020-01-15",
  "2020-01-14",
  "2020-01-13",
  "2020-01-12",
  "2020-01-11",
  "2020-01-10",
  "2020-01-09",
  "2020-01-08",
  "2020-01-07",
  "2020-01-06",
  "2020-01-05",
  "2020-01-04",
  "2020-01-03",
  "2020-01-02",
  "2020-01-01"
];
*/

const dates = ["2020-02-10"];
const path = "/Users/remim/dev/cdtn/cdtn-monolog/backup-logs/scripts/";

const allDays = dates.map(d => {
  const logPath = `${path}${d}.json`;
  console.log(logPath);
  const logs = convertLogs(logPath);
  return [d, logs];
});

const output = "/Users/remim/tmp/cdtn-2020/";

allDays.map(entry => {
  fs.writeFileSync(
    output + entry[0] + ".json",
    JSON.stringify(entry[1], null, 2),
    { flag: "w+" }
  );
});

/*
const stringifyStream = bjson.createStringifyStream({
  body: allDays
});

const writeStream = fs.createWriteStream(output);

stringifyStream.on("data", function(strChunk) {
  // => BIG_POJO will be sent out in JSON chunks as the object is traversed
  writeStream.write(strChunk);
});

stringifyStream.on("finish", function() {
  writeStream.end();
});
*/
