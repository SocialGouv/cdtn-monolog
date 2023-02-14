import "data-forge-fs";

import * as dataForge from "data-forge";
import * as path from "path";

import { Cache } from "../cdtn/cdtn.types";
import { readCache } from "../cdtn/resultCache";
import * as Reader from "../reader/logReader";
import { actionTypes } from "../reader/readerUtil";

export const logfile = path.join(__dirname, "__fixtures__/logs.csv");

export let largeData: dataForge.IDataFrame;
export let largeCache: Cache;

(async () => {
  try {
    largeData = await Reader.readFromFile(path.join(__dirname, "__fixtures__/large-data.csv"));

    largeCache = await readCache(path.join(__dirname, "__fixtures__/large-cache.json"));
  } catch (e) {
    console.log("Cannot read large test data or cache");
  }
})();

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const readLogfile = (): Promise<dataForge.IDataFrame> => Reader.readFromFile(logfile);

// TODO : ne semble plus utiliser, à vérifier puis supprimer

export const readLogFile = async (
  path: string
  // eslint-disable-next-line import/namespace
): Promise<dataForge.IDataFrame> => dataForge.readFile(path).parseCSV();

export const LOGS_TEST_INDEX = "logs_data-test";

export const buildDataFrameFromQueries = (queries: string[]): dataForge.IDataFrame =>
  new dataForge.DataFrame(queries.map((query) => ({ query, type: actionTypes.search })));
