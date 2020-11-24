import "data-forge-fs";

import * as dataForge from "data-forge";
import * as path from "path";

import * as Reader from "../reader/logReader";

export const logfile = path.join(__dirname, "__fixtures__/logs.csv");

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const readLogfile = (): Promise<dataForge.IDataFrame> =>
  Reader.readFromFile(logfile);

export const readLogFile = async (
  path: string
): Promise<dataForge.IDataFrame> => dataForge.readFile(path).parseCSV();

export const LOGS_TEST_INDEX = "logs-test";
