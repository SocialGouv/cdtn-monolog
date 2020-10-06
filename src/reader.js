// read data from file system or ES and create Dataframe

import "data-forge-fs";

import * as dataForge from "data-forge";

import { getDocuments } from "./elastic";
import { actionTypes, getLastDays } from "./util";

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
