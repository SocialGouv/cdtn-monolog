import * as fs from "fs";

import * as elastic from "../elastic";
import { logger } from "../logger";
import { mapAction, mappings } from "./mappings";

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
  "referrerName",
];

const parseAction = (action, visit) => {
  const parsedAction = {};
  parsedAction["timeSpent"] = action["timeSpent"];
  parsedAction["url"] = action["url"];

  whitelistNames.forEach((key) => {
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
        parsedAction["suggestionPrefix"] = action.eventAction;
        parsedAction["suggestionSelection"] = action.eventName;
        break;
      }
      case "feedback": {
        parsedAction["type"] = "feedback";
        parsedAction["feedbackType"] = action.eventAction;
        parsedAction["visited"] = action.eventName;
        break;
      }
      case "candidateSuggestions": {
        parsedAction["type"] = "suggestion_candidates";
        parsedAction["suggestionCandidates"] = action.eventAction.split("###");
        break;
      }
      case "candidateResults": {
        parsedAction["type"] = "result_candidates";
        parsedAction["query"] = action.eventAction;
        break;
      }
      case "nextResultPage": {
        parsedAction["type"] = "next_result_page";
        parsedAction["query"] = action.eventAction;
        break;
      }
      case "selectResult": {
        parsedAction["type"] = "select_result";
        parsedAction["resultSelection"] = JSON.parse(action.eventAction);
        break;
      }
      case "selectRelated": {
        parsedAction["type"] = "select_related";
        // for now we have to deal with several formats
        try {
          const actionParsed = JSON.parse(action.eventAction);
          parsedAction["recoSelection"] = actionParsed.selection;
          parsedAction["recoType"] = actionParsed.reco;
        } catch (err) {
          parsedAction["recoSelection"] = action.eventAction;
          parsedAction["recoType"] = "search";
        }
        break;
      }
      case "themeResults": {
        parsedAction["type"] = "theme_candidates";
        parsedAction["query"] = action.eventAction;
        break;
      }
      case "outil": {
        parsedAction["outilAction"] = action.eventAction.startsWith(
          "view_step_"
        )
          ? "view_step"
          : "click_previous";
        parsedAction["outil"] = action.eventAction.slice(
          action.eventAction.lastIndexOf("_") + 1
        );
        parsedAction["outilEvent"] = action.eventName;
        break;
      }
      case "cc_search": {
        parsedAction["type"] = action.eventCategory;
        parsedAction["query"] = action.eventName;
        parsedAction["ccAction"] = action.eventAction;
        break;
      }
      case "cc_select": {
        parsedAction["type"] = action.eventCategory;
        parsedAction["cc"] = action.eventName;
        parsedAction["ccAction"] = action.eventAction;
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

const parseVisit = (visit) => {
  if (visit.actionDetails !== undefined) {
    return visit.actionDetails.flatMap((action) => {
      return parseAction(action, visit);
    });
  } else {
    return [];
  }
};

const parse = (dumpPath) => {
  const rawData = fs.readFileSync(dumpPath);
  const rawVisits = JSON.parse(rawData);

  fs.writeFileSync(
    "test-dump.json",
    JSON.stringify(rawVisits.slice(0, 100), null, 2)
  );

  return rawVisits.flatMap((visit) => {
    return parseVisit(visit);
  });
};

const checkIndex = async (esClient, index) => {
  await elastic.testAndCreateIndex(esClient, index, mappings);
};

const ingest = async (esClient, dumpPath, index) => {
  logger.info(`Ingesting dump ${dumpPath} to ES.`);
  const actions = parse(dumpPath);
  const date = dumpPath.slice(
    dumpPath.lastIndexOf("/") + 1,
    dumpPath.lastIndexOf(".")
  );
  const actionDocs = actions.map((a) => mapAction(a, date));
  await elastic.batchInsert(esClient, index, actionDocs);
  return;
};

export { ingest, checkIndex };
