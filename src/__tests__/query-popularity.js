import "data-forge-fs";

import { DataFrame } from "data-forge";

import { analyse as popularityAnalysis } from "../analysis/popularity";
import { buildCache, readCache, writeCache } from "../analysis/queries";
import * as datasetUtil from "../dataset";
import { esClient, LOG_INDEX, REPORT_INDEX } from "../esConf";
import { readDaysFromElastic, readFromElastic, readFromFile } from "../reader";
import { resetReportIndex, saveReport, standardMappings } from "../reportStore";
import { actionTypes, getLastThreeMonthsComplete } from "../util";

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

  const total_queries = queries.length;

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

  /**@type {Map<string, {queries: Array<{query: string, count: number}>, total: number, total_normalized: number }>} */
  const counts = new Map();

  // we use a copy of our cache
  cache.forEach(({ queries: queryMap }) => {
    const queries = Array.from(queryMap.entries()).map(([query, count]) => ({
      count,
      query,
    }));
    const total = queries.reduce((acc, q) => acc + q.count, 0);
    // most frequent query
    const principalQuery = queries.sort((a, b) => b.count - a.count)[0].query;

    if (total > 0)
      counts.set(principalQuery, {
        queries,
        total,
        total_normalized: total / total_queries,
      });
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
export const genericPopularity = async (
  cache,
  queryMap,
  logs,
  m0,
  m1,
  m2,
  reportId
) => {
  // we build the cache
  //   const { cache, queryMap, logs } = await step1();

  // we split the logs
  // TODO borrowed from popularity

  // const refDate = Math.floor(start + (1 - proportion) * (end - start));

  // const afterRef = (a) => a.timestamp > refDate;

  /**
   *
   * @param {import("..").Cache} c
   */
  const cloneCache = (c) => {
    const e = Array.from(c.entries());
    return new Map(
      e.map(([idx, { queries, results }]) => [
        idx,
        { queries: new Map(queries), results: new Map(results) },
      ])
    );
  };

  const focus = logs.where((a) => m0.includes(a.logfile));
  const reference = logs.where((a) => m1.includes(a.logfile));
  const m2Data = logs.where((a) => m2.includes(a.logfile));

  // const testQ = "chômage partiel";

  const m0Cache = await step2(cloneCache(cache), queryMap, focus);
  const m0Start = focus.getSeries("timestamp").min();
  // console.log(focus.where((a) => a.query == testQ).count());
  // console.log(new Map(m0Cache).get(testQ));

  const m1Cache = await step2(cloneCache(cache), queryMap, reference);
  const m1Start = reference.getSeries("timestamp").min();
  // console.log(reference.where((a) => a.query == testQ).count());
  // console.log(new Map(m1Cache).get(testQ));

  const m2Cache = await step2(cloneCache(cache), queryMap, m2Data);
  const m2Start = m2Data.getSeries("timestamp").min();
  // console.log(m2Data.where((a) => a.query.toLowerCase() == testQ).count());
  // console.log(new Map(m2Cache).get(testQ));

  /* 
  const dates = logs.deflate((r) => r.timestamp);
  const start = dates.min();
  const end = dates.max();
  const refDate = Math.floor(start + (1 - proportion) * (end - start));

  const afterRef = (a) => a.timestamp > refDate;
  */

  // we compute counts for each split

  // we transform the counts into a proper dataframe
  const m0Counts = new DataFrame(
    m0Cache.map(([field, { total, total_normalized }]) => ({
      count: total,
      field,
      normalized_count: total_normalized,
    }))
  );

  const m1Counts = new DataFrame(
    m1Cache.map(([field, { total, total_normalized }]) => ({
      count: total,
      field,
      normalized_count: total_normalized,
    }))
  );

  const m2Counts = new DataFrame(
    m2Cache.map(([field, { total, total_normalized }]) => ({
      count: total,
      field,
      normalized_count: total_normalized,
    }))
  );
  // we compare the counts on the two period and select top x variations

  const reports = computeReports(
    m0Counts,
    m1Counts,
    m2Counts,

    m0Start,
    m1Start,
    m2Start,

    reportId,
    "query-popularity"
  );

  return reports;

  // const max = 4;
  /*
  console.log(new Date(end * 1000));
  console.log(JSON.stringify(countFocus.slice(0, max), null, 2));
  console.log("\n\n\n\n");
  console.log(new Date(start * 1000));
  console.log(new Date(end * 1000));
  console.log(JSON.stringify(countReference.slice(0, max), null, 2));
  */
};

const computeReports = (
  focusCounts,
  refCounts,
  previousMonthCount,

  focusStart,
  refStart,
  prevStart,

  reportId,
  reportType
) => {
  // FIXME use outer join to handle missing values (e.g. additions)

  const joinedM0M1 = refCounts.join(
    focusCounts,
    (left) => left.field,
    (right) => right.field,
    (left, right) => {
      return {
        field: left.field,
        m0_count: right.count,
        m0_norm_count: right.normalized_count,
        m1_count: left.count,
        m1_norm_count: left.normalized_count,
      };
    }
  );

  const joined = joinedM0M1.join(
    previousMonthCount,
    (left) => left.field,
    (right) => right.field,
    (left, right) => {
      return {
        ...left,
        m2_count: right.count,
      };
    }
  );

  const nContent = 40;
  const minOccurence = 40;

  const diff = joined
    .generateSeries({
      diff: (row) => row.m0_norm_count - row.m1_norm_count,
    })
    .generateSeries({
      abs_diff: (row) => Math.abs(row.diff),
    })
    .generateSeries({
      rel_diff: (row) => (row.m0_count - row.m1_count) / row.m1_count,
    })
    .where((r) => r.m1_count + r.m0_count + r.m2_count > minOccurence);

  const topDiff = diff.orderByDescending((r) => r.abs_diff).take(nContent);
  const topPop = diff.orderByDescending((r) => r.m0_count).take(nContent);

  const top = topDiff.concat(topPop).distinct((row) => row.field);

  return top.toArray().map((doc) => ({
    doc,
    m0_start: focusStart * 1000,
    m1_start: refStart * 1000,
    m2_start: prevStart * 1000,
    reportId,
    reportType,
  }));
};

const xpOctobre = 92;
const cacheFile = "cache-aug-sep-oct.json";

const apiCache = "cache-sep-oct.json";

const saveCache = async () => {
  const logs = await readFromElastic(
    esClient,
    LOG_INDEX,
    new Date(),
    xpOctobre,
    [actionTypes.search]
  );
  const { cache } = await buildCache(logs, 2);
  console.log(cache.get(2));
  writeCache(cache, apiCache);
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
  const cache = await readCache(apiCache);
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

const [m0, m1, m2] = getLastThreeMonthsComplete();

/**
 * Queries
 */

// readDaysFromElastic(esClient, LOG_INDEX, [m0, m1, m2].flat(), [
// actionTypes.search,
// ]).then((logs) => logs.asCSV().writeFileSync("searches-aug-sep-oct.csv"));

// genericPopularity()
// saveCache()
// .then(() => loadCache())
// .then(() => console.log("done"));

loadCache()
  .then(async ({ cache, queryMap }) => {
    /*
    const logs = await readFromElastic(
      esClient,
      LOG_INDEX,
      new Date(),
      xpOctobre,
      [actionTypes.search]
    );
    */
    const logs = await readFromFile("searches-aug-sep-oct.csv");

    const reports = await genericPopularity(
      cache,
      queryMap,
      logs,
      m0,
      m1,
      m2,
      "102020"
    );
    // console.log(JSON.stringify(reports, null, 2));
    await saveReport(esClient, REPORT_INDEX, reports);
  })
  .catch((err) => console.log(err));

/**
 * Contents
 */
// / readFromElastic(esClient, LOG_INDEX, new Date(), xpOctobre, [
// actionTypes.visit,
// ]).then((logs) => logs.asCSV().writeFileSync("logs-october.csv"));

/*
readFromFile(`logs-october.csv`).then((dataset) => {
  const visits = datasetUtil.getVisits(dataset);
  const uniqueViews = DataFrame.concat(
    visits.select((visit) => datasetUtil.toUniqueViews(visit)).toArray()
  );

  const countURLs = (dataframe) => {
    const counts = dataframe
      .deflate((a) => a.url)
      .groupBy((value) => value)
      .select((group) => {
        return {
          count: group.count(),
          field: group.first(),
        };
      })
      .inflate()
      .orderByDescending((r) => r.count);

    const sum = counts.deflate((r) => r.count).sum();
    const normalizedCounts = counts.withSeries({
      normalized_count: (df) =>
        df.deflate((row) => row.count).select((count) => count / sum),
    });
    return normalizedCounts.setIndex("url");
  };

  console.log(countURLs(uniqueViews).take(50).toString());

  const { focusCounts, refCounts, start, end, refDate } = popularityAnalysis(
    dataset,
    0.5
    // "contribution"
  );
  /*
  console.log(start);
  console.log(new Date(start * 100));
  console.log(focusCounts.take(50).toString());
  console.log(refCounts.take(50).toString());
});
  */

// /*

// readDaysFromElastic(esClient, LOG_INDEX, [m0, m1, m2].flat(), [
// actionTypes.visit,
// ]).then((logs) => logs.asCSV().writeFileSync(cacheFile));

// readFromElastic(esClient, LOG_INDEX, new Date(), xpOctobre, [
// actionTypes.visit,
// ]).then((logs) => logs.asCSV().writeFileSync(cacheFile));
// /*

// resetReportIndex(esClient, REPORT_INDEX, standardMappings)
/* .then(() => readFromFile(cacheFile))
  .then(async (logs) => {
    const {
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,
    } = popularityAnalysis(logs, m0, m1, m2);
    const reports = computeReports(
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,

      "102020",
      "content-popularity"
    );
    await saveReport(esClient, REPORT_INDEX, reports);
    console.log(JSON.stringify(reports, null, 2));
    return logs;
  })
  .then(async (logs) => {
    const {
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,
    } = popularityAnalysis(logs, m0, m1, m2, "convention-collective/");
    const reports = computeReports(
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,

      "102020",
      "convention-popularity"
    );
    await saveReport(esClient, REPORT_INDEX, reports);
    console.log(JSON.stringify(reports, null, 2));
    return logs;
  })
  .then(async (logs) => {
    const {
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,
    } = popularityAnalysis(logs, m0, m1, m2, "contribution");
    const reports = computeReports(
      m0Counts,
      m1Counts,
      m2Counts,

      m0Start,
      m1Start,
      m2Start,

      "102020",
      "contribution-popularity"
    );
    await saveReport(esClient, REPORT_INDEX, reports);
    console.log(JSON.stringify(reports, null, 2));
  });

/**
 * Conventions collectives
 */
/*
readFromElastic(esClient, LOG_INDEX, new Date(), xpOctobre, [
  actionTypes.selectCC,
]).then((logs) => {
  //
});
*/
