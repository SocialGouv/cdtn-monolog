import { DataFrame, IDataFrame } from "data-forge";
import { isSome, none, Option } from "fp-ts/lib/Option";

import { Cache, CacheQueryCluster } from "../cdtn/cdtn.types";
import { getVisits, toUniqueSearches, toUniqueViews } from "../reader/dataset";
import { actionTypes, urlToPath } from "../reader/readerUtil";
import { joinOuter3DfOnFieldColumn } from "./dataframeUtils";
import { PopularityReport } from "./reports";

const reportType = (pt: PopularityTypeString): string => `${pt.toLowerCase()}-popularity`;

const removeAnchor = (url: string) => {
  // remove query parameters
  if (url.includes("?")) {
    url = url.substring(0, url.indexOf("?"));
  }
  return url.split("#")[0].toLowerCase();
};

export const computeReports = (
  focusCounts: IDataFrame,
  refCounts: IDataFrame,
  previousMonthCount: IDataFrame,

  focusStart: number,
  refStart: number,
  prevStart: number,

  reportId: string,
  reportType: string
) => {
  const joined = joinOuter3DfOnFieldColumn(focusCounts, refCounts, previousMonthCount);

  const nContent = 40;
  const minOccurence = 40;

  const diff = joined
    .where((r) => r.m1_count + r.m0_count + r.m2_count > minOccurence && r.field != "")
    .generateSeries({
      diff: (row) => row.m0_norm_count - row.m1_norm_count,
    })
    .generateSeries({
      abs_diff: (row) => Math.abs(row.diff),
    })
    .generateSeries({
      rel_diff: (row) => (row.m1_count > 0 ? (row.m0_count - row.m1_count) / row.m1_count : 0),
    });

  const topDiff = diff.orderByDescending((r: any) => r.abs_diff).take(nContent);
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

export enum PopularityType {
  CONTENT,
  CONVENTION,
  QUERY,
}

type PopularityTypeString = keyof typeof PopularityType;

const countURLs = (dataframe: IDataFrame) => {
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
    normalized_count: (df) => df.deflate((row) => row.count).select((count) => count / sum),
  });
  return normalizedCounts.setIndex("url");
};

export const countQueries = (
  logs: IDataFrame,
  cache: Option<Cache>,
  dictOfIndexAndQueries: Map<number, string>
): DataFrame => {
  if (isSome(cache)) {
    const queries = logs
      .where((a) => a.type == actionTypes.search)
      .getSeries("query")
      .toArray()
      .filter((a) => a && a != "undefined")
      .map((q) => q.toLowerCase());

    type ClusterCount = Array<{ query: string; count: number }>;
    const clusterCounts = new Map<number, ClusterCount>();

    console.log(queries.length);

    queries.forEach((currQ) => {
      const idx = cache.value.queryMap.get(currQ);
      const entry = idx != undefined ? cache.value.clusters.get(idx) : 0;

      // case no entry or no result in entry
      if (idx == undefined || !entry || (entry as CacheQueryCluster).results.size == 0) {
        //TODO
        //   console.log("Issue " + query);
        //   console.log(idx);
        return;
      }

      if (!clusterCounts.has(idx)) {
        // add cluster
        const cluster = entry.queries.map((query) => ({ count: 0, query }));
        clusterCounts.set(idx, cluster);
      }

      // increment count
      const cc = clusterCounts.get(idx)?.find(({ query }) => currQ == query);
      if (!cc) {
        //TODO
        //   console.log("Issue " + query);
        //   console.log(idx);
        return;
      } else {
        cc.count += 1;
      }
    });

    type ClusterReport = {
      count: number;
      field: string;
      normalized_count: number;
    };

    const reportedClusters: ClusterReport[] = Array.from(clusterCounts.entries())
      .map(([idx, cc]) => {
        const count = cc.reduce((acc, next) => acc + next.count, 0);
        const normalized_count = count / queries.length;
        // most frequent query
        let field = cc.sort((a, b) => b.count - a.count)[0].query;
        if (!dictOfIndexAndQueries.has(idx)) {
          dictOfIndexAndQueries.set(idx, field);
        } else {
          field = <string>dictOfIndexAndQueries.get(idx);
        }

        if (field == "amiante") {
          console.log(cc);
        }

        return { count, field, normalized_count };
      })
      .sort((a, b) => b.count - a.count);

    return new DataFrame(reportedClusters);
  } else {
    // TODO this is ugly
    throw new Error("Cache not set");
  }
};

/**
 *
 * @param dataset
 * @param m0 focus period : m0
 * @param m1 reference period (m0 - 1)
 * @param m2 two months ago (m0 - 2)
 * @param reportId
 * @param popularityType
 * @param cache
 */
const analyse = (
  dataset: IDataFrame,
  m0: string[],
  m1: string[],
  m2: string[],
  reportId: string,
  popularityType: PopularityTypeString,
  cache: Option<Cache> = none
): PopularityReport[] => {
  // if query popoularity, cache is required
  if (popularityType == PopularityType[PopularityType.QUERY] && cache == none) {
    throw new Error("Cache required for query popularity report");
  }

  const visits = getVisits(dataset);

  // FIXME for unkwown reason this doesn't work
  /*
  console.log(
    visits
      .select((visit) => toUniqueViews(visit))
      .inflate()
      .take(2)
      .toString()
  );
  */

  // so we use toArray for now
  const grouping = popularityType == PopularityType[PopularityType.QUERY] ? toUniqueSearches : toUniqueViews;
  const uniqueViews = DataFrame.concat(visits.select((visit) => grouping(visit)).toArray());

  const idxUniqueViews = uniqueViews.withIndex(Array.from(Array(uniqueViews.count()).keys()));

  // clean views
  const noError = (action: any) =>
    ![
      "https://code.travail.gouv.fr/",
      "https://code.travail.gouv.fr/?xtor=ES-29-[BIE_202_20200130]-20200130-[https://code.travail.gouv.fr/]",
      "https://code.travail.gouv.fr/droit-du-travail",
    ].includes(action.url);

  // TODO change this
  let filter = "";
  if (popularityType == PopularityType[PopularityType.CONVENTION]) {
    filter = "convention-collective/";
  }

  const filterUrl = (action: any) => (filter ? action.url.includes(filter) : true);

  const filteredVisitViews = idxUniqueViews.where(noError).where(filterUrl);

  const cleanedViews = filteredVisitViews.transformSeries({
    url: (u) => urlToPath(removeAnchor(u)),
  });
  const focus = cleanedViews.where((a) => m0.includes(a.logfile));
  const reference = cleanedViews.where((a) => m1.includes(a.logfile));
  const m2Data = cleanedViews.where((a) => m2.includes(a.logfile));

  const m0Start = focus.getSeries("timestamp").min();
  const m1Start = reference.getSeries("timestamp").min();
  const m2Start = m2Data.getSeries("timestamp").min();

  let m0Counts, m1Counts, m2Counts;
  if (popularityType != PopularityType[PopularityType.QUERY]) {
    m0Counts = countURLs(focus);
    m1Counts = countURLs(reference);
    m2Counts = countURLs(m2Data);
  } else {
    const dictOfIndexAndQueries = new Map<number, string>();
    // dictOfIndexAndQueries will be modified by parameters
    m0Counts = countQueries(focus, cache, dictOfIndexAndQueries);
    m1Counts = countQueries(reference, cache, dictOfIndexAndQueries);
    m2Counts = countQueries(m2Data, cache, dictOfIndexAndQueries);
  }

  return computeReports(
    m0Counts,
    m1Counts,
    m2Counts,

    m0Start,
    m1Start,
    m2Start,

    reportId,
    reportType(popularityType)
  );
};

export { analyse, countURLs, removeAnchor, reportType, urlToPath };
