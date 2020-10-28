import { buildCache, readCache, writeCache } from "../analysis/queries";
import { esClient, LOG_INDEX } from "../esConf";
import { readFromElastic } from "../reader";
import { actionTypes } from "../util";

/**
 * Step 1 - Build search engine cache :
 * - query clusters : id + list of queries + API ordered results
 * - query map : query -> cluster id
 */

/**
 * @returns {Promise<{ cache: import("..").Cache; queryMap: Map<string, number>; logs: import("data-forge").IDataFrame}>}
 */
const step1 = async () => {
  const logs = (
    await readFromElastic(esClient, LOG_INDEX, new Date(), 10, [
      actionTypes.search,
    ])
  ).take(1000);
  const { cache, queryMap } = await buildCache(logs, 0);

  return { cache, logs, queryMap };
};

/**
 * Step 2 - Compute popularity board for given period + reference
 * - group and count queries using clusters
 * - compute popularity board like the content board
 */
/**
 *
 * @param {import("..").Cache} cache
 * @param {Map<string, number>} queryMap
 * @param {import("data-forge").IDataFrame} logs
 */
const step2 = async (cache, queryMap, logs) => {
  const queries = logs
    .where((a) => a.type == actionTypes.search)
    .getSeries("query")
    .toArray()
    .filter((a) => a && a != "undefined")
    .map((q) => q.toLowerCase());

  queries.forEach((query) => {
    const idx = queryMap.get(query);
    const entry = cache.get(idx);

    if (!entry) {
      //   console.log("Issue " + query);
      //   console.log(idx);
      return;
    }

    const curr = entry.queries.get(query);
    entry.queries.set(query, curr + 1);
  });

  /**@type {Map<string, {queries: Array<{query: string, count: number }>, total: number}>} */
  const counts = new Map();

  // we use a copy of our cache
  new Map(cache).forEach(({ queries: queryMap }) => {
    const queries = Array.from(queryMap.entries()).map(([query, count]) => ({
      count,
      query,
    }));
    const total = queries.reduce((acc, q) => acc + q.count, 0);
    // most frequent query
    const principalQuery = queries.sort((a, b) => b.count - a.count)[0].query;

    if (total > 0) counts.set(principalQuery, { queries, total });
  });

  return Array.from(counts.entries()).sort((a, b) => b[1].total - a[1].total);
};

/**
 * Run a popularity analysis for a given period, using generic content equality
 *
 * @param {import("..").Cache} cache
 * @param {Map<string, number>} queryMap
 * @param {import("data-forge").IDataFrame} logs
 */
export const genericPopularity = async (cache, queryMap, logs) => {
  // we build the cache
  //   const { cache, queryMap, logs } = await step1();

  // we split the logs
  // TODO borrowed from popularity

  const proportion = 0.3;
  const dates = logs.deflate((r) => r.timestamp);
  const start = dates.min();
  const end = dates.max();
  const refDate = Math.floor(start + (1 - proportion) * (end - start));

  const afterRef = (a) => a.timestamp > refDate;

  const focus = logs.where(afterRef);
  const reference = logs.where((a) => !afterRef(a));

  // we compute counts for each split
  const countFocus = await step2(cache, queryMap, focus);
  const countReference = await step2(cache, queryMap, reference);

  const max = 40;
  console.log(new Date(refDate * 1000));
  console.log(new Date(end * 1000));
  console.log(JSON.stringify(countFocus.slice(0, max), null, 2));
  console.log("\n\n\n\n");
  console.log(new Date(start * 1000));
  console.log(new Date(end * 1000));
  console.log(JSON.stringify(countReference.slice(0, max), null, 2));
};

const saveCache = async () => {
  const logs = await readFromElastic(esClient, LOG_INDEX, new Date(), 60, [
    actionTypes.search,
  ]);
  const { cache } = await buildCache(logs, 2);
  console.log(cache.get(2));
  writeCache(cache, "cache.json");
};

/**
 *
 * @param {import("..").Cache} cache
 */
const queryMapFromCache = (cache) => {
  const queryMap = new Map();
  cache.forEach(({ queries }, idx) => {
    queries.forEach((_, query) => queryMap.set(query, idx));
  });
  return queryMap;
};

const loadCache = async () => {
  const cache = await readCache("cache.json");
  const queryMap = queryMapFromCache(cache);

  return { cache, queryMap };

  //   console.log(cache.get(2));
  //   return cache;

  //   // TODO duplicated from queries build cache
  //   const queryClusters = [...groups.values()];

  //   // a map to get the query group id from any query : Map<query, clusterIndex>
  //   /** @type{Map.<string, number>} */
  //   const queryMap = new Map(
  //     queryClusters.flatMap((queryCluster, i) =>
  //       queryCluster.map((query) => [query, i])
  //     )
  //   );
};

// genericPopularity()
// saveCache()
//   .then(() => loadCache())
loadCache()
  .then(async ({ cache, queryMap }) => {
    const logs = await readFromElastic(esClient, LOG_INDEX, new Date(), 60, [
      actionTypes.search,
    ]);
    genericPopularity(cache, queryMap, logs);
  })
  .catch((err) => console.log(err));
