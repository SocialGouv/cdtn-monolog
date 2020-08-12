import * as dataForge from "data-forge";

import * as datasetUtil from "../dataset";
import * as util from "../util";

const reportType = "popularity";

const analyse = (dataset, proportion, reportId) => {
  const visits = datasetUtil.getVisits(dataset);

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
  const uniqueViews = dataForge.DataFrame.concat(
    visits.select((visit) => datasetUtil.toUniqueViews(visit)).toArray()
  );

  // clean views
  const noError = (action) =>
    ![
      "https://code.travail.gouv.fr/",
      "https://code.travail.gouv.fr/?xtor=ES-29-[BIE_202_20200130]-20200130-[https://code.travail.gouv.fr/]",
      "https://code.travail.gouv.fr/droit-du-travail",
    ].includes(action.url);

  const filteredVisitViews = uniqueViews.where(noError);

  const removeAnchor = (url) => {
    return url.split("#")[0];
  };

  const cleanedViews = filteredVisitViews.transformSeries({
    url: (u) => util.urlToPath(removeAnchor(u)),
  });

  const dates = uniqueViews.deflate((r) => r.timestamp);
  const start = dates.min();
  const end = dates.max();
  const refDate = Math.floor(start + (1 - proportion) * (end - start));

  const afterRef = (a) => a.timestamp > refDate;

  const focus = cleanedViews.where(afterRef);
  const reference = cleanedViews.where((a) => !afterRef(a));

  const countURLs = (dataframe) => {
    const counts = dataframe
      .deflate((a) => a.url)
      .groupBy((value) => value)
      .select((group) => {
        return {
          count: group.count(),
          url: group.first(),
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

  const refCounts = countURLs(reference);
  const focusCounts = countURLs(focus);

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
};

export { analyse, reportType };
