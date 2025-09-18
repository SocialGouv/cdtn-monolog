import { logger } from "@socialgouv/cdtn-logger";
import * as fs from "fs";
import { Transform } from "stream";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

import * as elastic from "../es/elastic";
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

const parseAction = (action: MatomoAction, visit: MatomoVisit, logfile: string): MonologAction => {
  const matomoActionFields = (({ url, timeSpent, timestamp }) => ({
    timeSpent,
    timestamp: timestamp + 28800,
    url,
  }))(action);

  const matomoVisitFields = (({
    idVisit,
    serverTimePretty,
    referrerName,
    referrerTypeName,
    referrerUrl,
    lastActionTimestamp,
    lastActionDateTime,
  }) => ({
    idVisit,
    lastActionDateTime,
    lastActionTimestamp,
    referrerName,
    referrerTypeName,
    referrerUrl,
    serverTimePretty,
  }))(visit);

  const matomoAbTestingFields = (() => {
    const firstExp = visit.experiments?.[0];
    return firstExp ? { abName: firstExp.name, abVariant: firstExp.variation?.name } : {};
  })();

  const uvi = hash(`${visit.idVisit}-${visit.lastActionDateTime}`);

  const partialMonologAction: VisitFields & RootAction & MonologFields = {
    ...matomoActionFields,
    ...matomoAbTestingFields,
    ...matomoVisitFields,
    logfile,
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
    return visit.actionDetails.flatMap((action: MatomoAction) => parseAction(action, visit, logfile));
  } else {
    return [];
  }
};

const parse = (rawData: string, logfile: string): MonologAction[] => {
  // use io-ts / Reader
  const rawVisits: MatomoVisit[] = JSON.parse(rawData);

  fs.writeFileSync("test-dump.json", JSON.stringify(rawVisits.slice(0, 100), null, 2));

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
  const logfile = dumpPath.slice(dumpPath.lastIndexOf("/") + 1, dumpPath.lastIndexOf("."));

  return new Promise((resolve, reject) => {
    // Create a batch array to collect actions
    let actions: MonologAction[] = [];
    const BATCH_SIZE = 1000;

    // Create the streaming pipeline
    const pipeline: Transform = chain([fs.createReadStream(dumpPath), parser(), streamArray()]);

    // Process each visit object as it comes in
    pipeline.on("data", (data: any) => {
      const visit: MatomoVisit = data.value;
      const visitActions = parseVisit(visit, logfile);
      actions = actions.concat(visitActions);

      // When we reach the batch size, process and reset
      if (actions.length >= BATCH_SIZE) {
        const batchToProcess = actions;
        actions = [];

        // Process batch
        elastic.batchInsert(index, batchToProcess).catch((err) => {
          pipeline.destroy();
          reject(err);
        });
      }
    });

    // Handle the end of the stream
    pipeline.on("end", async () => {
      try {
        // Process any remaining actions
        if (actions.length > 0) {
          await elastic.batchInsert(index, actions);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    // Handle errors
    pipeline.on("error", (err: NodeJS.ErrnoException) => {
      logger.error(`Error processing file ${dumpPath}: ${err}`);
      reject(err);
    });
  });
};

export { checkIndex, ingest };
