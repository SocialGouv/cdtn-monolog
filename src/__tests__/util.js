import * as path from "path";
import * as Reader from "../reader";

export const logfile = path.join(__dirname, "__fixtures__/logs.csv");

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const readLogfile = () => Reader.readFromFile(logfile);
