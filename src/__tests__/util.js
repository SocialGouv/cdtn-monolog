import * as path from "path";

export const logfile = path.join(__dirname, "__fixtures__/logs.csv");

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
