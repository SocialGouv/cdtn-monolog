// here we analyze search queries
import { getRouteBySource } from "@socialgouv/cdtn-sources";
import * as fs from "fs";
import * as murmur from "murmurhash-js";
import PQueue from "p-queue";
import * as readline from "readline";

import { triggerSearch } from "../cdtnApi";
import * as datasetUtil from "../dataset";
import { logger } from "../logger";
import { actionTypes } from "../util";

const reportType = "query";

// we deduplicate queries and only select the one appearing
// at least {minOccurence} times
const deduplicateQueries = (dataset, minOccurence) =>
  dataset
    .where((a) => a.type == actionTypes.search)
    .groupBy((r) => r.query)
    .select((group) => ({ count: group.count(), query: group.first().query }))
    .inflate()
    .where((r) => r.count >= minOccurence)
    .getSeries("query")
    .toArray()
    .filter((a) => a)
    .map((q) => q.toLowerCase());

// get all search queries and build a cache of the responses
export const buildCache = async (dataset, minOccurence = 0) => {
  const pqueue = new PQueue({ concurrency: 16 });

  // we get all unique queries
  const queries = deduplicateQueries(dataset, minOccurence);

  logger.info(
    `Calling API for ${queries.length} queries, this might take some time`
  );

  const pSearches = Array.from(queries).map((query) =>
    pqueue.add(() =>
      triggerSearch(query)
        .then(({ documents }) => ({
          // use base64 to reduce cache size and ease comparison
          // documents: Buffer.from(JSON.stringify(json.documents)).toString(
          //   "base64"
          // ),
          documents,
          query,
        }))
        .catch(() => {
          logger.error("Cannot retrieve results for query :" + query);
          return { documents: [], query };
        })
    )
  );

  const results = await Promise.all(pSearches);

  await pqueue.onIdle();

  logger.info("API calls completed.");

  // grouping queries : Map<documentResults, list of queries>
  /** @type{Map.<*, Array.<string>>} */
  const groups = new Map();

  // grouping query and docs : Map<query, documentResults>
  /** @type{Map.<string, *>} */
  const resultCache = new Map();

  results.forEach(({ query, documents }) => {
    // const resultKey = murmur.murmur3(JSON.stringify(documents), 42);
    const resultKey = JSON.stringify(documents);
    if (!groups.has(resultKey)) {
      groups.set(resultKey, [query]);
    } else {
      groups.get(resultKey).push(query);
    }

    resultCache.set(query, documents);
  });

  const queryClusters = [...groups.values()];

  // a map to get the query group id from any query : Map<query, clusterIndex>
  /** @type{Map.<string, number>} */
  const queryMap = new Map(
    queryClusters.flatMap((queryCluster, i) =>
      queryCluster.map((query) => [query, i])
    )
  );

  // we build a list of clusters, containing : an id, a list of queries, the API documents
  const cache = new Map(
    queryClusters.map((queryGroup, i) => [
      i,
      {
        queries: new Map(queryGroup.map((q) => [q, 0])),
        results: new Map(
          resultCache
            .get(queryGroup[0])
            // we should use ids here once they're available directly in the URL
            .map(({ algo, source, slug }) => [
              "/" + getRouteBySource(source) + "/" + slug,
              { algo, count: 0 },
            ])
        ),
      },
    ])
  );

  return { cache, queryMap };
};

const computeNDCG = (results) => {
  const dcg = [...results.values()].reduce(
    (acc, val, index) => acc + val.count / Math.log2(index + 1 + 1),
    0
  );

  const idcg = [...results.values()]
    .sort((a, b) => b.count - a.count)
    .reduce((acc, val, i) => acc + val.count / Math.log2(i + 1 + 1), 0);

  const ndcg = idcg && dcg ? dcg / idcg : 0;

  return { dcg, idcg, ndcg };
};

const runEvaluation = (counts) => {
  // count queries and results
  [...counts.values()].forEach((obj) => {
    obj.queriesCount = [...obj.queries.values()].reduce((acc, i) => i + acc, 0);
    obj.selectionsCount = [...obj.results.values()].reduce(
      (acc, i) => i.count + acc,
      0
    );
    Object.assign(obj, computeNDCG(obj.results));
  });

  const clusters = [...counts.values()].map((queryCluster) => {
    const { dcg, idcg, ndcg, queriesCount, selectionsCount } = queryCluster;
    const v = queryCluster.results.values().next().value;
    const type = v && v.algo != "pre-qualified" ? "search" : "pre-qualified";

    const queries = (Array.from(queryCluster.queries) || []).map(
      ([query, count]) => ({
        count,
        query,
      })
    );

    const results = (
      Array.from(queryCluster.results) || []
    ).map(([result, { algo, count }]) => ({ algo, count, result }));

    return {
      dcg,
      idcg,
      ndcg,
      queries,
      queriesCount,
      results,
      selectionsCount,
      type,
    };
  });

  return clusters;
};

// non functionnal implementation here, we increment counts,
// might be worth swapping with immutable implementation at one point
export const analyseVisit = (queryMap, counts) => (v) => {
  const actions = v.where((a) =>
    [actionTypes.search, actionTypes.selectResult].includes(a.type)
  );

  // remove duplicates
  const searches = Array.from(
    new Set(
      actions
        .getSeries("query")
        .toArray()
        .filter((q) => q)
        .map((q) => q.toLowerCase())
    )
  );

  // we increment query count and retrieve results lists
  const results = searches.map((q) => {
    const group = queryMap.get(q);
    const count = counts.get(group);

    if (!count) {
      // logger.error("Cannot find results for query : " + q);
      // logger.error(group);
      return new Map();
    }

    count.queries.set(q, count.queries.get(q) + 1);

    return count.results;
  });

  const resultSelections = actions.where(
    (a) => a.type == actionTypes.selectResult
  );

  // if no selection, not much to do
  if (!resultSelections.count()) return;

  // we unfold the result selection object in two columns
  const unfoldedResultSelections = resultSelections.withSeries({
    resultSelectionAlgo: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.algo : undefined
      ),
    resultSelectionUrl: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.url : undefined
      ),
  });

  const urlSelected = new Set(
    unfoldedResultSelections
      .getSeries("resultSelectionUrl")
      .toArray()
      .filter((q) => q)
  );

  urlSelected.forEach((url) => {
    const incrementSelection = () => {
      for (const r of results) {
        if (r.has(url)) {
          const obj = r.get(url);
          r.set(url, { algo: obj.algo, count: obj.count + 1 });
          return true;
        }
      }
      return false;
    };

    const found = incrementSelection();

    if (!found) {
      // TODO: what should we do here ?
      logger.error(`Selection not in results : ${url}`);
    }
  });
};

const generateIndexReport = (queryClusters) => {
  const [sumNdcg, sumSelectionCount] = queryClusters
    .map((doc) => [doc.ndcg * doc.selectionsCount, doc.selectionsCount])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);

  const meanSelectionCount = sumSelectionCount / queryClusters.length;

  // identify problems : above mean selection and poor score
  const problems = queryClusters
    .filter(
      (cluster) =>
        cluster.selectionsCount > meanSelectionCount && cluster.ndcg < 0.8
    )
    .map((cluster) => ({
      count: cluster.selectionsCount,

      ndcg: cluster.ndcg,
      // forcing string
      ...cluster.queries[0],
    }));

  return {
    mean: meanSelectionCount,
    ndcg: sumNdcg / sumSelectionCount,
    problems,
  };
};

export const analyse = async (dataset, reportId = new Date().getTime()) => {
  // get all search queries and build cache for each request using CDTN API
  // counts : a map that store each query group with : queries and occurences / results and clicks
  const { cache: counts, queryMap } = await buildCache(dataset);

  // go through each visit and count queries and selection
  datasetUtil
    .getVisits(dataset.reverse())
    .toArray()
    .filter((v) => v.where((a) => a.type == actionTypes.search).count() > 0)
    .forEach(analyseVisit(queryMap, counts));

  // run evaluation
  const evaluatedQueryClusters = runEvaluation(counts)
    // at least 2 queries
    .filter((d) => d.queriesCount >= 2);

  const hashQueries = (cluster) =>
    murmur.murmur3(JSON.stringify(cluster.queries), 42);

  const queryClusterReports = evaluatedQueryClusters.map((cluster) => ({
    ...cluster,
    queryKey: hashQueries(cluster),
    reportId,
    reportType,
  }));

  const queryClusterIndexReport = {
    ...generateIndexReport(evaluatedQueryClusters),
    reportId,
    reportType: reportType + "-index",
  };

  // console.log(JSON.stringify(queryClusterIndexReport, null, 2));

  // and finally build reports
  return [queryClusterIndexReport, ...queryClusterReports];
};

/**
 *
 * @param {import("..").Cache} cache
 */
export const writeCache = async (cache, file) => {
  // const cache = await buildCache(data);
  var writer = fs.createWriteStream(file);
  cache.forEach(({ queries, results }) => {
    writer.write(
      JSON.stringify({ queries: [...queries], results: [...results] })
    );
    writer.write("\n");
  });
  writer.end();
};

/**
 *
 * @param {string} file
 * @returns {Promise<import("..").Cache>}
 */
export const readCache = async (file) => {
  const readInterface = readline.createInterface({
    crlfDelay: Infinity,
    input: fs.createReadStream(file),
  });

  const cacheB64 = [];

  for await (const line of readInterface) {
    cacheB64.push(JSON.parse(line));
  }

  const cacheObj = cacheB64.map(({ queries, results }) => ({
    queries: new Map(queries),
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

  /**@type {import("..").Cache} */
  const cache = new Map();
  cacheObj.forEach((obj, idx) => cache.set(idx, obj));

  return cache;
};
