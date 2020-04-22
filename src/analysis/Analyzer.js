import * as dataForge from "data-forge";
import { suggestionSelectionType } from "./utils";

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
    const uniqueViews = visits.map((v) => v.getUniqueViews());

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
}
