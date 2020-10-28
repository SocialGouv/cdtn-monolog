// read data from file system or ES and create Dataframe

import "data-forge-fs";

import * as dataForge from "data-forge";
import PQueue from "p-queue";

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

  const { docs } = await getDocuments(esClient, index, query, undefined);

  // return a Dataframe containing actions
  return new dataForge.DataFrame({ considerAllRows: true, values: docs });
};

// count visit per days in Elastic
export const countVisits = async (esClient, index, days) => {
  const esQueue = new PQueue({ concurrency: 4 });

  const makeAgg = (day) => ({
    aggs: {
      visit_count: {
        cardinality: {
          field: "uvi",
          precision_threshold: 10000,
        },
      },
    },
    query: {
      bool: {
        must: [
          {
            match: {
              logfile: day,
            },
          },
        ],
      },
    },
  });

  const getCount = (day) => {
    const { query, aggs } = makeAgg(day);
    return getDocuments(esClient, index, query, aggs, false).then(
      ({ aggregations }) => ({
        count: aggregations.visit_count.value,
        day,
      })
    );
  };

  const countCalls = days.map((day) => esQueue.add(() => getCount(day)));
  const counts = await Promise.all(countCalls);
  await esQueue.onIdle();

  return new dataForge.DataFrame({ considerAllRows: true, values: counts });
};

export const readFromFile = async (path) => dataForge.readFile(path).parseCSV();
