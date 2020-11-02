import "data-forge-fs";

import { DataFrame } from "data-forge";

import { analyse as popularityAnalysis } from "../analysis/popularity";
import { buildCache, readCache, writeCache } from "../analysis/queries";
import * as datasetUtil from "../dataset";
import { esClient, LOG_INDEX, REPORT_INDEX } from "../esConf";
import { readFromElastic, readFromFile } from "../reader";
import { saveReport } from "../reportStore";
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
  new Map(cache).forEach(({ queries: queryMap }) => {
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
export const genericPopularity = async (cache, queryMap, logs, reportId) => {
  // we build the cache
  //   const { cache, queryMap, logs } = await step1();

  // we split the logs
  // TODO borrowed from popularity

  const proportion = 0.5;
  const dates = logs.deflate((r) => r.timestamp);
  const start = dates.min();
  const end = dates.max();
  const refDate = Math.floor(start + (1 - proportion) * (end - start));

  const afterRef = (a) => a.timestamp > refDate;

  const focus = logs.where(afterRef);
  const reference = logs.where((a) => !afterRef(a));

  // we compute counts for each split
  const countFocus = await step2(cache, queryMap, focus);
  // we transform the counts into a proper dataframe
  const focusCounts = new DataFrame(
    countFocus.map(([field, { total, total_normalized }]) => ({
      count: total,
      field,
      normalized_count: total_normalized,
    }))
  );

  const countReference = await step2(cache, queryMap, reference);
  const refCounts = new DataFrame(
    countReference.map(([field, { total, total_normalized }]) => ({
      count: total,
      field,
      normalized_count: total_normalized,
    }))
  );

  // we compare the counts on the two period and select top x variations
  const reports = computeReports(
    refCounts,
    focusCounts,
    start,
    refDate,
    end,
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
  refCounts,
  focusCounts,
  start,
  refDate,
  end,
  reportId,
  reportType
) => {
  // FIXME use outer join to handle missing values (e.g. additions)
  const joined = refCounts.join(
    focusCounts,
    (left) => left.field,
    (right) => right.field,
    (left, right) => {
      return {
        field: left.field,
        focus_count: right.count,
        focus_norm_count: right.normalized_count,
        ref_count: left.count,
        ref_norm_count: left.normalized_count,
      };
    }
  );

  const nContent = 40;
  const minOccurence = 100;

  const diff = joined
    .generateSeries({
      diff: (row) => row.focus_norm_count - row.ref_norm_count,
    })
    .generateSeries({
      abs_diff: (row) => Math.abs(row.diff),
    })
    .generateSeries({
      rel_diff: (row) => (row.focus_count - row.ref_count) / row.ref_count,
    })
    .where((r) => r.ref_count + r.focus_count > minOccurence);

  const topDiff = diff.orderByDescending((r) => r.abs_diff).take(nContent);
  const topPop = diff.orderByDescending((r) => r.focus_count).take(nContent);

  const top = topDiff.concat(topPop).distinct((row) => row.field);

  return top.toArray().map((doc) => ({
    doc,
    end: end,
    pivot: refDate,
    reportId,
    reportType,
    start: start,
  }));
};

const xpOctobre = 62;
const cacheFile = "cache-sep-oct.json";

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
  writeCache(cache, cacheFile);
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
  const cache = await readCache(cacheFile);
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

/**
 * Queries
 */

// genericPopularity()
// saveCache()
// .then(() => loadCache())
// .then(() => console.log("done"));
/*
loadCache()
  .then(async ({ cache, queryMap }) => {
    const logs = await readFromElastic(
      esClient,
      LOG_INDEX,
      new Date(),
      xpOctobre,
      [actionTypes.search]
    );
    const reports = await genericPopularity(cache, queryMap, logs, "102020");
    // console.log(JSON.stringify(reports, null, 2));
    await saveReport(esClient, REPORT_INDEX, reports);
  })
  .catch((err) => console.log(err));
  */

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
// readFromFile(`logs-october.csv`)

readFromElastic(esClient, LOG_INDEX, new Date(), xpOctobre, [actionTypes.visit])
  // ]).then((logs) => logs.asCSV().writeFileSync("logs-october.csv"));
  .then(async (logs) => {
    const { focusCounts, refCounts, start, end, refDate } = popularityAnalysis(
      logs,
      0.5
      // "contribution"
    );
    const reports = computeReports(
      refCounts,
      focusCounts,
      start,
      refDate,
      end,
      "102020",
      "content-popularity"
    );
    await saveReport(esClient, REPORT_INDEX, reports);
    console.log(JSON.stringify(reports, null, 2));
    return logs;
  })
  .then(async (logs) => {
    const { focusCounts, refCounts, start, end, refDate } = popularityAnalysis(
      logs,
      0.5,
      "convention-collective/"
    );
    const reports = computeReports(
      refCounts,
      focusCounts,
      start,
      refDate,
      end,
      "102020",
      "convention-popularity"
    );
    await saveReport(esClient, REPORT_INDEX, reports);
    console.log(JSON.stringify(reports, null, 2));
    return logs;
  })
  .then(async (logs) => {
    const { focusCounts, refCounts, start, end, refDate } = popularityAnalysis(
      logs,
      0.5,
      "contribution"
    );
    const reports = computeReports(
      refCounts,
      focusCounts,
      start,
      refDate,
      end,
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
