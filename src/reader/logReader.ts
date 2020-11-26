// read data from file system or ES and create Dataframe

import "data-forge-fs";

import { DataFrame, IDataFrame, readFile } from "data-forge";
import PQueue from "p-queue";

import { getDocuments } from "../es/elastic";
import { actionTypes, getLastDays } from "./readerUtil";

const defaultTypesToConsider = Object.values(actionTypes);

export const readDaysFromElastic = async (
  index: string,
  days: string[],
  type: string[]
): Promise<IDataFrame> => {
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

  const { docs } = await getDocuments(index, query, undefined);

  // return a Dataframe containing actions
  const data = new DataFrame({ considerAllRows: true, values: docs });

  // in case we return select result type, we need to
  // unfold the result selection object in two columns
  const unfoldedData = type.includes(actionTypes.selectResult)
    ? data.withSeries({
        resultSelectionAlgo: (df) =>
          df
            .deflate((row) => row.resultSelection)
            .select((resultSelection) =>
              resultSelection ? resultSelection.algo : undefined
            ),
        resultSelectionUrl: (df) =>
          df
            .deflate((row) => row.resultSelection)
            .select((resultSelection) =>
              resultSelection ? resultSelection.url : undefined
            ),
      })
    : data;

  return unfoldedData;
};

// read logs in Elastic : nDays before referenceDate
export const readFromElastic = async (
  index: string,
  referenceDate: Date,
  nDays: number,
  type = defaultTypesToConsider
): Promise<IDataFrame> => {
  const days = getLastDays(nDays, referenceDate);
  return readDaysFromElastic(index, days, type);
};

// count visit per days in Elastic
export const countVisits = async (
  index: string,
  days: string[]
): Promise<DataFrame> => {
  const esQueue = new PQueue({ concurrency: 4 });

  const makeAgg = (day: string) => ({
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

  const getCount = (day: string) => {
    const { query, aggs } = makeAgg(day);
    return getDocuments(index, query, aggs, false).then(({ aggregations }) => ({
      count: aggregations.visit_count.value,
      day,
    }));
  };

  const countCalls = days.map((day) => esQueue.add(() => getCount(day)));
  const counts = await Promise.all(countCalls);
  await esQueue.onIdle();

  return new DataFrame({ considerAllRows: true, values: counts });
};

export const readFromFile = async (path: string): Promise<IDataFrame> =>
  readFile(path).parseCSV();
