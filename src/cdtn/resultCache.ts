import { logger } from "@socialgouv/cdtn-logger";
import { getRouteBySource } from "@socialgouv/cdtn-sources";
import { IDataFrame } from "data-forge";
import * as fs from "fs";
import PQueue from "p-queue";
import * as readline from "readline";

import { esClient, LOG_INDEX } from "../es/elastic";
import { actionTypes } from "../reader/readerUtil";
import { Cache, CacheQueryCluster, Document } from "./cdtn.types";
import { triggerSearch } from "./cdtnApi";

// we deduplicate queries and only select the one appearing
// at least {minOccurence} times
export const deduplicateQueries = (dataset: IDataFrame, minOccurence: number): string[] =>
  dataset
    .where((a) => a.type == actionTypes.search)
    .groupBy((r) => r.query.toLowerCase())
    .select((group) => ({ count: group.count(), query: group.first().query }))
    .inflate()
    .where((r) => r.count >= minOccurence)
    .getSeries("query")
    .toArray()
    .filter((a) => a)
    .map((q) => q.toLowerCase());

const buildQueryMap = (queryClusters: string[][]) =>
  new Map<string, number>(queryClusters.flatMap((queryCluster, i) => queryCluster.map((query: string) => [query, i])));

// get all search queries and build a cache of the responses
export const buildCache = async (): Promise<Cache> => {
  /*
  {
  "size": 0,
  "query": {
    "term": {
      "type": "search"
    }
  },
  "aggs": {
    "grouped_queries": {

      "terms": {
        "field": "query",
        "min_doc_count": 10,
        "size": 20000
      }
    }
  }
}

   */
  const pqueue = new PQueue({ concurrency: 16 });

  // we get all unique queries (deduplicate when happening in same visit + min occurence)
  // const visits = getVisits(dataset);
  // const uniqueSearches = DataFrame.concat(visits.select((visit) => toUniqueSearches(visit)).toArray());

  // const queries: string[] = deduplicateQueries(uniqueSearches, minOccurence);

  logger.info("Getting all queries from ES");
  const result = await esClient.search({
    body: {
      size: 0,
      query: {
        bool: {
          must: [],
          filter: [
            {
              match_phrase: {
                type: "search",
              },
            },
            {
              exists: {
                field: "query",
              },
            },
            {
              range: {
                lastActionTimestamp: {
                  format: "strict_date_optional_time",
                  gte: "2023-05-01T00:00:00.000Z",
                  lte: "2023-06-01T23:59:59.999Z",
                },
              },
            },
          ],
          should: [],
          must_not: [],
        },
      },
      aggs: {
        grouped_queries: {
          terms: {
            field: "query",
            min_doc_count: 2,
            size: 20000,
          },
        },
      },
    },
    index: LOG_INDEX,
    size: 20000,
  });

  const queries: string[] = result.body.aggregations.grouped_queries.buckets.map((bucket: any) => bucket.key);

  logger.info(`Calling API for ${queries.length} queries, this might take some time`);

  // for prequalified results, we want to remove "completed results" and only keep PQ since #2037
  const isolatePrequalified = (documents: Document[]) =>
    documents[0].algo == "pre-qualified" ? documents.filter((d) => d.algo == "pre-qualified") : documents;

  const pSearches = Array.from(queries).map((query) =>
    pqueue.add(() =>
      triggerSearch(query)
        .then(({ documents }) => ({
          // use base64 to reduce cache size and ease comparison
          // documents: Buffer.from(JSON.stringify(json.documents)).toString(
          //   "base64"
          // ),
          documents: isolatePrequalified(documents),
          query,
        }))
        .catch(() => {
          logger.error("Cannot retrieve results for query : " + query);
          return { documents: [] as Document[], query };
        })
    )
  );

  const results = await Promise.all(pSearches);

  await pqueue.onIdle();

  logger.info("API calls completed.");

  // grouping queries : Map<documentResults, list of queries>
  const groups = new Map<string, string[]>();

  // grouping query and docs : Map<query, documentResults>
  const resultCache = new Map<string, Document[]>();

  results.forEach(({ query, documents }) => {
    // const resultKey = murmur.murmur3(JSON.stringify(documents), 42);
    const resultKey = JSON.stringify(documents);
    if (!groups.has(resultKey)) {
      groups.set(resultKey, [query]);
    } else {
      groups.get(resultKey)?.push(query);
    }

    resultCache.set(query, documents);
  });

  const queryClusters = [...groups.values()];

  const queryMap = buildQueryMap(queryClusters);

  // we build a list of clusters, containing : an id, a list of queries, the API documents
  const cache: Map<number, CacheQueryCluster> = new Map(
    queryClusters.map((queryGroup, i) => [
      i,
      {
        queries: queryGroup,
        results: new Map(
          resultCache
            .get(queryGroup[0])
            // we should use ids here once they're available directly in the URL
            ?.map(({ algo, cdtnId, source, slug }: Document) => [
              "/" + getRouteBySource(source) + "/" + slug,
              { algo, cdtnId },
            ])
        ),
      },
    ])
  );

  return { clusters: cache, queryMap };
};

export const persistCache = (cache: Cache, output: string): void => {
  const writer = fs.createWriteStream(output);
  cache.clusters.forEach(({ queries, results }) => {
    writer.write(JSON.stringify({ queries, results: [...results] }));
    writer.write("\n");
  });
  writer.end();
};

export const readCache = async (file: string): Promise<Cache> => {
  const readInterface = readline.createInterface({
    crlfDelay: Infinity,
    input: fs.createReadStream(file),
  });

  const cacheB64 = [];

  for await (const line of readInterface) {
    cacheB64.push(JSON.parse(line));
  }

  const clusters: CacheQueryCluster[] = cacheB64.map(({ queries, results }) => ({
    queries: queries,
    // documents: JSON.parse(new Buffer(documents, "base64")),
    results: new Map(results),
  }));

  // const groups = new Map();

  // cacheB64.forEach(({ query, documents }) => {
  //   if (!groups.has(documents)) {
  //     groups.set(documents, [query]);
  //   } else {
  //     groups.get(documents).push(query);
  //   }
  // });

  // const queryGroups = [...groups.values()];

  const cache = new Map<number, CacheQueryCluster>();
  clusters.forEach((obj, idx) => cache.set(idx, obj));

  const queryMap = buildQueryMap([...clusters.values()].map((e) => e.queries));

  return { clusters: cache, queryMap };
};
