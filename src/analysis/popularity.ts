import { DataFrame, IDataFrame } from "data-forge";

import { getVisits, toUniqueViews } from "../reader/dataset";
import { urlToPath } from "../reader/readerUtil";

const reportType = (pt: PopularityTypeString): string =>
  `popularity-${pt.toLowerCase()}`;

const computeReports = (
  focusCounts: IDataFrame,
  refCounts: IDataFrame,
  previousMonthCount: IDataFrame,

  focusStart: number,
  refStart: number,
  prevStart: number,

  reportId: number,
  reportType: string
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

const analyse = (
  dataset: IDataFrame,
  m0: string[],
  m1: string[],
  m2: string[],
  reportId: number,
  popularityType: PopularityTypeString
) => {
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
  const uniqueViews = DataFrame.concat(
    visits.select((visit) => toUniqueViews(visit)).toArray()
  );

  const idxUniqueViews = uniqueViews.withIndex(
    Array.from(Array(uniqueViews.count()).keys())
  );

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

  const filterUrl = (action: any) =>
    filter ? action.url.includes(filter) : true;

  const filteredVisitViews = idxUniqueViews.where(noError).where(filterUrl);

  const removeAnchor = (url: string) => {
    return url.split("#")[0];
  };

  const cleanedViews = filteredVisitViews.transformSeries({
    url: (u) => urlToPath(removeAnchor(u)),
  });

  //   const dates = uniqueViews.deflate((r) => r.timestamp);
  //   const start = dates.min();
  //   const end = dates.max();

  // const refDate = Math.floor(start + (1 - proportion) * (end - start));

  // const afterRef = (a) => a.timestamp > refDate;

  const focus = cleanedViews.where((a) => m0.includes(a.logfile));
  const reference = cleanedViews.where((a) => m1.includes(a.logfile));
  const m2Data = cleanedViews.where((a) => m2.includes(a.logfile));

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
      normalized_count: (df) =>
        df.deflate((row) => row.count).select((count) => count / sum),
    });
    return normalizedCounts.setIndex("url");
  };

  const m0Counts = countURLs(focus);
  const m0Start = focus.getSeries("timestamp").min();

  const m1Counts = countURLs(reference);
  const m1Start = reference.getSeries("timestamp").min();

  const m2Counts = countURLs(m2Data);
  const m2Start = m2Data.getSeries("timestamp").min();

  const reports = computeReports(
    m0Counts,
    m1Counts,
    m2Counts,

    m0Start,
    m1Start,
    m2Start,

    reportId,
    reportType(popularityType)
  );

  return reports;

  /*
  // FIXME use outer join to handle missing values (e.g. additions)
  const joined = refCounts.join(
    focusCounts,
    (left) => left.url,
    (right) => right.url,
    (left, right) => {
      return {
        focus_count: right.count,
        focus_norm_count: right.normalized_count,
        ref_count: left.count,
        ref_norm_count: left.normalized_count,
        url: left.url,
      };
    }
  );

  const nContent = 40;

  const diff = joined
    .generateSeries({
      diff: (row) => row.focus_norm_count - row.ref_norm_count,
    })
    .generateSeries({
      abs_diff: (row) => Math.abs(row.diff),
    })
    .orderByDescending((r) => r.abs_diff)
    .take(nContent);

  return diff.toArray().map((doc) => ({
    doc,
    end: end,
    pivot: refDate,
    reportId,
    reportType,
    start: start,
  }));
  */
};

export { analyse, reportType };
