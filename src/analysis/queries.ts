import { IDataFrame } from "data-forge";
import * as murmur from "murmurhash-js";

import { Cache } from "../cdtn/cdtn.types";
import * as datasetUtil from "../reader/dataset";
import { actionTypes } from "../reader/readerUtil";

type QueryGroup = {
  // the different queries returning the same results and their count
  queries: Map<string, number>;
  // the document results : Map<documentPath, {algo: fulltext|prequalified|semantic, cdtnId, count}>
  results: Map<string, { algo: string; cdtnId: string; count: number }>;
};

type Metrics = {
  ndcg: number;
  idcg: number;
  dcg: number;
  queriesCount: number;
  selectionsCount: number;
};

type QueryCluster = Metrics & {
  queries: {
    count: number;
    query: string;
    suggestion: boolean;
  }[];
  results: {
    algo: string;
    count: number;
    result: string;
  }[];
  selectionsRatio: number;
  type: string;
};

const reportType = "query";

const computeNDCG = (results: Map<string, { count: number }>) => {
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

const runEvaluation = (
  counts: Map<number, QueryGroup>,
  suggestions: Set<string>
): QueryCluster[] => {
  // count queries and results
  [...counts.values()].forEach((obj) => {
    const queriesCount = [...obj.queries.values()].reduce(
      (acc, i) => i + acc,
      0
    );
    const selectionsCount = [...obj.results.values()].reduce(
      (acc, i) => i.count + acc,
      0
    );
    // TODO we ignore types here
    Object.assign(obj, { queriesCount, selectionsCount });
    Object.assign(obj, computeNDCG(obj.results));
  });

  const clusters = [...counts.values()].map((queryCluster) => {
    // TODO see above
    const {
      dcg,
      idcg,
      ndcg,
      queriesCount,
      selectionsCount,
    } = queryCluster as QueryGroup & Metrics;

    const v = queryCluster.results.values().next().value;
    const type = v && v.algo != "pre-qualified" ? "search" : "pre-qualified";

    const queries = (Array.from(queryCluster.queries) || [])
      .map(([query, count]) => ({
        count,
        query,
        suggestion: suggestions.has(query),
      }))
      .sort((a, b) => b.count - a.count);

    const results = (
      Array.from(queryCluster.results) || []
    ).map(([result, { algo, count }]) => ({ algo, count, result }));

    const selectionsRatio =
      selectionsCount && queriesCount ? selectionsCount / queriesCount : 0;

    return {
      dcg,
      idcg,
      ndcg,
      queries,
      queriesCount,
      results,
      selectionsCount,
      selectionsRatio,
      type,
    };
  });

  return clusters;
};

// non functionnal implementation here, we increment counts,
// might be worth swapping with immutable implementation at one point
const analyseVisit = (
  queryMap: Map<string, number>,
  counts: Map<number, QueryGroup>
) => (v: any) => {
  const actions = v.where((a: any) =>
    [actionTypes.search, actionTypes.selectResult].includes(a.type)
  );

  // remove duplicates
  const searches: string[] = Array.from(
    new Set(
      actions
        .getSeries("query")
        .toArray()
        .filter((q: string) => q)
        .map((q: string) => q.toLowerCase())
    )
  );

  // we increment query count and retrieve results lists
  const results = searches.map((q) => {
    const group = queryMap.get(q);
    const count = group ? counts.get(group) : undefined;

    if (!count) {
      // logger.error("Cannot find results for query : " + q);
      // logger.error(group);
      return new Map();
    }

    count.queries.set(q, count.queries.get(q) || 0 + 1);

    return count.results;
  });

  const resultSelections = actions.where(
    (a: any) => a.type == actionTypes.selectResult
  );

  // if no selection, not much to do
  if (!resultSelections.count()) return;

  // we unfold the result selection object in two columns
  /* done beforehand
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
    */

  const urlSelected = new Set(
    // unfoldedResultSelections
    resultSelections
      .getSeries("resultSelectionUrl")
      .toArray()
      .filter((q: string) => q)
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
      // logger.error(`Selection not in results : ${url}`);
    }
  });
};

const sums = (queryClusters: QueryCluster[]) =>
  queryClusters
    .map((doc) => [
      doc.ndcg * doc.selectionsCount,
      doc.selectionsCount,
      doc.queriesCount,
    ])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);

const generateIndexReport = (queryClusters: QueryCluster[]) => {
  const [sumNdcg, sumSelectionCount, sumQueriesCount] = sums(queryClusters);
  const meanSelectionCount = sumSelectionCount / queryClusters.length;
  const meanQueriesCount = sumQueriesCount / queryClusters.length;

  const pqClusters = queryClusters.filter((q) => q.type != "search");
  const lengthPQ = pqClusters.length;
  const [sumNdcgPQ, sumSelectionCountPQ, sumQueriesCountPQ] = sums(pqClusters);

  const esClusters = queryClusters.filter((q) => q.type == "search");
  const lengthES = esClusters.length;
  const [sumNdcgES, sumSelectionCountES, sumQueriesCountES] = sums(esClusters);

  // identify problems : above mean selection and poor score
  const ndcgThreshold = 0.85;
  const selectionRatioThreshold = 0.6;

  const problems = queryClusters
    .filter(
      (cluster) =>
        cluster.queriesCount > meanQueriesCount &&
        (cluster.ndcg < ndcgThreshold ||
          cluster.selectionsRatio < selectionRatioThreshold)
    )
    .map((cluster) => ({
      ndcg: cluster.ndcg,
      queriesCount: cluster.queriesCount,
      query: cluster.queries[0].query,
      selectionCount: cluster.selectionsCount,
      selectionRatio: cluster.selectionsRatio,
      type: cluster.type,
    }));

  return {
    meanQueryCount: meanQueriesCount,
    meanSelectionCount: meanSelectionCount,
    ndcg: sumNdcg / sumSelectionCount,
    prequalified: {
      clusters: lengthPQ,
      meanQueryCount: sumQueriesCountPQ / lengthPQ,
      meanSelectionCount: sumSelectionCountPQ / lengthPQ,
      ndcg: sumNdcgPQ / sumSelectionCountPQ,
      queryCount: sumQueriesCountPQ,
      selectionCount: sumSelectionCountPQ,
      selectionRatio: sumSelectionCountPQ / sumQueriesCountPQ,
    },
    problems,
    search: {
      clusters: lengthES,
      meanQueryCount: sumQueriesCountES / lengthES,
      meanSelectionCount: sumSelectionCountES / lengthES,
      ndcg: sumNdcgES / sumSelectionCountES,
      queryCount: sumQueriesCountES,
      selectionCount: sumSelectionCountES,
      selectionRatio: sumSelectionCountES / sumQueriesCountES,
    },
    sumQueriesCount,
    sumSelectionCount,
  };
};

export const analyse = (
  dataFrame: IDataFrame,
  queryCache: Cache,
  suggestions: Set<string>,
  reportId = new Date().getTime()
) => {
  // get all search queries and build cache for each request using CDTN API
  // counts : a map that store each query group with : queries and occurences / results and clicks
  // const { cache: counts, queryMap } = await buildCache(dataset);

  const queryMap = queryCache.queryMap;

  // we transform the clusters into a "counting" format to increment counts based on logs
  const counts = new Map<number, QueryGroup>();
  queryCache.clusters.forEach((cacheCluster, index) => {
    const queries = new Map(cacheCluster.queries.map((q) => [q, 0]));
    const results = new Map();
    cacheCluster.results.forEach((obj, url) => {
      results.set(url, { count: 0, ...obj });
    });

    counts.set(index, { queries, results });
  });

  /*
  const queryMap = new Map(
    Array.from(queryCache.clusters.entries()).flatMap(([i, { queries }]) =>
      Array.from(queries.keys()).map((q) => [q, i])
    )
  );
  */

  // go through each visit and count queries and selection
  datasetUtil
    .getVisits(dataFrame.reverse())
    .toArray()
    .filter(
      (v) => v.where((a: any) => a.type == actionTypes.search).count() > 0
    )
    .forEach(analyseVisit(queryMap, counts));

  // run evaluation
  const evaluatedQueryClusters = runEvaluation(counts, suggestions)
    // at least 2 queries
    .filter((d) => d.queriesCount && d.queriesCount >= 2);

  const hashQueries = (cluster: QueryCluster) =>
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
