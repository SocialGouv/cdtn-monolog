// read data from file system or ES and create Dataframe

import "data-forge-fs";

import * as dataForge from "data-forge";

import { getDocuments } from "./elastic";
import { actionTypes } from "./util";

// get last n days before ref
const getLastDays = (n, ref) => {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;

  const createDate = (i) => new Date(ref.getTime() - (i + 1) * dayMillis);
  const formatDate = (date) => date.toISOString().split("T")[0];

  return [...Array(n).keys()].map(createDate).map(formatDate);
};

const defaultTypesToConsider = Object.values(actionTypes);

// read logs in Elastic : nDays before referenceDate
export const readFromElastic = async (
  esClient,
  index,
  referenceDate,
  nDays,
  type = defaultTypesToConsider
) => {
  const days = getLastDays(nDays, referenceDate);

  const query = {
    bool: {
      must: [
        {
          bool: { should: days.map((d) => ({ match: { logfile: d } })) },
        },
        { terms: { type } },
      ],
    },
  };

  const docs = await getDocuments(esClient, index, query);

  // return a Dataframe containing actions
  return new dataForge.DataFrame({ considerAllRows: true, values: docs });
};

export const readFromFile = async (path) => dataForge.readFile(path).parseCSV();
