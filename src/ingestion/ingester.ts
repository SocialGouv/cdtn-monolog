import * as fs from "fs";

import * as elastic from "../es/elastic";
import { logger } from "../logger";
import { parseEvent, parseSearch, parseStandard } from "./actionParsers";
import {
  MatomoAction,
  MatomoVisit,
  MonologAction,
  MonologActionFields,
  MonologFields,
  RootAction,
  VisitFields,
} from "./ingestion.types";
import { mappings } from "./mappings";

// shameless copy paste from stack overflow as non critical and
// to avoid adding yet another dependency
const hash = (s: string) =>
  s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

const parseAction = (
  action: MatomoAction,
  visit: MatomoVisit,
  logfile: string
): MonologAction => {
  const matomoActionFields = (({ url, timeSpent, timestamp }) => ({
    timeSpent,
    timestamp: timestamp + 28800,
    url,
  }))(action);

  const matomoVisitFields = (({
    idVisit,
    serverTimePretty,
    referrerTypeName,
    referrerName,
    lastActionTimestamp,
    lastActionDateTime,
  }) => ({
    idVisit,
    lastActionDateTime,
    lastActionTimestamp,
    referrerName,
    referrerTypeName,
    serverTimePretty,
  }))(visit);

  const uvi = hash(`${visit.idVisit}-${visit.lastActionDateTime}`);

  const partialMonologAction: VisitFields & RootAction & MonologFields = {
    ...matomoActionFields,
    ...matomoVisitFields,
    logfile,
    nActions: visit.actionDetails.length,
    uvi,
  };

  const monologActionFields: MonologActionFields = ((action: MatomoAction) => {
    if (action.type == "search") {
      return parseSearch(action);
    } else if (action.type == "action") {
      return parseStandard(action);
    } else if (action.type == "event") {
      return parseEvent(action);
    } else {
      return { type: action.type };
    }
  })(action);

  return { ...partialMonologAction, ...monologActionFields };
};

const parseVisit = (visit: MatomoVisit, logfile: string) => {
  if (visit.actionDetails !== undefined) {
    return visit.actionDetails.flatMap((action: MatomoAction) =>
      parseAction(action, visit, logfile)
    );
  } else {
    return [];
  }
};

const parse = (rawData: string, logfile: string) => {
  // use io-ts / Reader
  const rawVisits: MatomoVisit[] = JSON.parse(rawData);

  fs.writeFileSync(
    "test-dump.json",
    JSON.stringify(rawVisits.slice(0, 100), null, 2)
  );

  return rawVisits.flatMap((visit) => {
    return parseVisit(visit, logfile);
  });
};

// TODO should return TaskEither
const checkIndex = async (index: string): Promise<void> => {
  await elastic.testAndCreateIndex(index, mappings);
};

// TODO should return TaskEither
const ingest = async (dumpPath: string, index: string): Promise<void> => {
  logger.info(`Ingesting dump ${dumpPath} to ES.`);
  const logfile = dumpPath.slice(
    dumpPath.lastIndexOf("/") + 1,
    dumpPath.lastIndexOf(".")
  );

  // TODO hmm hmm
  const rawData = (fs.readFileSync(dumpPath) as unknown) as string;

  const actions = parse(rawData, logfile);

  await elastic.batchInsert(index, actions);
  return;
};

export { checkIndex, ingest };
