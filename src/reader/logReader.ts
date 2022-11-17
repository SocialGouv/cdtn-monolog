// read data from file system or ES and create Dataframe
import "data-forge-fs";

import { DataFrame, IDataFrame, readFile } from "data-forge";
import fs from "fs";
import PQueue from "p-queue";

import { getDocuments } from "../es/elastic";
import { actionTypes, getLastDays } from "./readerUtil";

const defaultTypesToConsider = Object.values(actionTypes);

export const delay = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const build_query = (day: string, type: Array<string>) => {
  return {
    bool: {
      must: [
        {
          bool: { should: { match: { logfile: day } } },
        },
        { terms: { type } },
      ],
    },
  };
};
export const queryAndWrite = async (
  index: string,
  day: string,
  query: any,
  output: string,
  type: string[]
): Promise<void> => {
  console.log(`reading ${day}`);
  const { docs } = await getDocuments(index, query, undefined);
  const data = await new DataFrame({ considerAllRows: true, values: docs });
  // in case we return select result type, we need to
  // unfold the result selection object in two columns
  const unfoldedData = (await type.includes(actionTypes.selectResult))
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
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
  }
  console.log(`writing ${day}`);
  await unfoldedData.asCSV().writeFile(output + "/" + day);
};
export const readDaysAndWrite = async (
  index: string,
  days: string[],
  type: string[],
  output: string
): Promise<void> => {
  const queries = days.map((day) => build_query(day, type));
  const queries_and_days = queries.map((q, i) => ({
    day: days[i],
    query: q,
  }));

  Promise.all(
    queries_and_days.map((query_days) =>
      queryAndWrite(index, query_days.day, query_days.query, output, type)
    )
  );
  return;
};

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
    return getDocuments(index, query, aggs, false, true).then(
      ({ aggregations }) => ({
        count: aggregations.visit_count.value,
        day,
      })
    );
  };

  const countCalls = days.map((day) => esQueue.add(() => getCount(day)));
  const counts = await Promise.all(countCalls);
  await esQueue.onIdle();

  return new DataFrame({ considerAllRows: true, values: counts });
};

export const readFromFile = async (path: string): Promise<IDataFrame> =>
  readFile(path).parseCSV();

export const readSingleFile = async (
  file: string,
  path: string
): Promise<IDataFrame<number, any>> => {
  return readFile(path + "/" + file).parseCSV();
};
export const readFromFolder = async (path: string): Promise<IDataFrame> => {
  const files = fs.readdirSync(path);
  const arr: any[] = [];
  for (const file of files) {
    arr.push(await readSingleFile(file, path));
  }
  const singleDf = DataFrame.concat(arr);
  return singleDf;
};
