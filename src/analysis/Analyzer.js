import * as dataForge from "data-forge";
import { suggestionSelectionType, urlToPath } from "../utils";

export default class Analyzer {
  constructor(dataset) {
    this.dataset = dataset;
  }

  // count views for each content
  viewCount() {
    const visits = this.dataset.getVisits();
    const uniqueViews = visits.map((v) => v.getUniqueViews());
    const series = dataForge.Series.concat(uniqueViews);

    // group by value
    const counts = series
      .groupBy((value) => value)
      .select((group) => {
        return {
          url: group.first(),
          count: group.count(),
        };
      })
      .inflate();

    return counts;
  }

  // covisit graph to identify the links between content :
  // each covisit (different contents viewed during the same visit) is recorded
  // we create a graph where nodes are content and an edge between contents A and B
  // represent the number of time A and B were viewed during the same visit
  covisitGraph() {
    const visits = this.dataset.getVisits();
    const uniqueViews = visits.map((v) =>
      v.getUniqueViews().deflate((row) => row.url)
    );

    // unique key to represent link between a & b
    const toKey = (a, b) => (a < b ? `${a}__${b}` : `${b}__${a}`);

    const graph = new Map();

    uniqueViews.forEach((vv) => {
      const visitViews = vv.toArray();
      if (visitViews.length > 1) {
        // visitViews.map((v) => console.log(v.toString()));
        // get all pairs of contents A/B
        const covisits = visitViews.reduce((acc, a, i) => {
          acc.push(...visitViews.slice(i + 1).map((b) => [a, b]));
          return acc;
        }, []);

        covisits.forEach(([a, b]) => {
          const key = toKey(a, b);
          if (!graph.has(key)) {
            graph.set(key, { nodes: [a, b], count: 1 });
          } else {
            graph.get(key).count++;
          }
        });
      }
    });

    const contents = new Map();

    graph.forEach((edge) => {
      const [a, b] = edge.nodes;

      const addToContent = (x, y) => {
        if (!contents.has(x)) {
          contents.set(x, new Map());
        }
        contents.get(x).set(y, edge.count);
      };

      // only keep if count is more than MIN_OCC
      const MIN_OCC = 5;
      if (edge.count > MIN_OCC) {
        addToContent(a, b);
        addToContent(b, a);
      }
    });

    const sortedContents = new Map();
    // sort contents by count
    contents.forEach((counts, url) => {
      const sorted = new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
      sortedContents.set(url, sorted);
    });

    return sortedContents;
  }

  computeSuggestionWeights() {
    const suggestions = this.dataset
      .getVisits()
      .map((v) => v.getActionsByType(suggestionSelectionType));
  }

  popularity(proportion = 0.8) {
    // deduplicate views
    const visits = this.dataset.getVisits();
    const visitViews = visits.map((v) => v.getUniqueViews());
    const uniqueViews = dataForge.DataFrame.concat(visitViews);

    /*
    noisy_urls = 
    */
    // clean views
    const noError = (action) =>
      ![
        "https://code.travail.gouv.fr/",
        "https://code.travail.gouv.fr/?xtor=ES-29-[BIE_202_20200130]-20200130-[https://code.travail.gouv.fr/]",
        "https://code.travail.gouv.fr/droit-du-travail",
      ].includes(action.url);

    // visitViews.forEach((v) => {
    //   if (v.where((vv) => !noError(vv)).count()) {
    //     console.log(v.toString());
    //   }
    // });

    const filteredVisitViews = uniqueViews.where(noError);

    const removeSection = (url) => {
      return url.split("#")[0];
    };

    const cleanedViews = filteredVisitViews.transformSeries({
      url: (u) => urlToPath(removeSection(u)),
    });

    const dates = uniqueViews.deflate((r) => r.timestamp);
    const start = dates.min();
    const end = dates.max();
    const refDate = start + proportion * (end - start);

    const afterRef = (a) => a.timestamp > refDate;

    const focus = cleanedViews.where(afterRef);
    const reference = cleanedViews.where((a) => !afterRef(a));

    const countURLs = (dataframe) => {
      const counts = dataframe
        .deflate((a) => a.url)
        .groupBy((value) => value)
        .select((group) => {
          return {
            url: group.first(),
            count: group.count(),
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
          url: left.url,
          ref_norm_count: left.normalized_count,
          focus_norm_cunt: right.normalized_count,
          ref_count: left.count,
          focus_count: right.count,
        };
      }
    );

    // const diff =
    // joined.deflate((v) => v.focusCount) - joined.deflate((v) => v.refCount);

    const nContent = 40;

    const diff = joined
      .generateSeries({
        diff: (row) => row.focus_norm_cunt - row.ref_norm_count,
      })
      .generateSeries({
        abs_diff: (row) => Math.abs(row.diff),
      })
      .orderByDescending((r) => r.abs_diff)
      .take(nContent);

    const toDate = (timestamp) => new Date(timestamp * 1000).toISOString();

    return {
      start: toDate(start),
      end: toDate(end),
      pivot: toDate(refDate),
      results: diff.toArray(),
    };

    // console.log(refCounts.take(20).toString());
    // console.log(focusCounts.take(20).toString());

    // console.log(noSectionVVs.where((a) => a.uvi == -493195456).toString());
    // console.log(noSectionVVs.where((a) => a.uvi == -1237521544).toString());

    // use 5 weeeks : 1-4 : reference / 5 : focus
    // const datasetRef = this.dataset;
    // const datasetFocus = this.dataset;
  }
}
