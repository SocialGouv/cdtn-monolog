// read data from file system or ES and create Dataframe

import * as dataForge from "data-forge";
import "data-forge-fs";
import { LOG_INDEX_NAME } from "./esConf";
import { getDocuments } from "./elastic";

// get last n days before ref
const getLastDays = (n, ref) => {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;

  const createDate = (i) => new Date(ref.getTime() - (i + 1) * dayMillis);
  const formatDate = (date) => date.toISOString().split("T")[0];

  return [...Array(n).keys()].map(createDate).map(formatDate);
};

export const readFromElastic = async (n, ref = new Date()) => {
  const days = getLastDays(n, ref);

  const query = {
    bool: {
      should: [
        days.map((d) => {
          return { match: { logfile: d } };
        }),
      ],
    },
  };

  const docs = await getDocuments(LOG_INDEX_NAME, query);

  // return a Dataframe containing actions
  return new dataForge.DataFrame({ values: docs, considerAllRows: true });
};

export const readFromFile = async (path) => dataForge.readFile(path).parseCSV();
