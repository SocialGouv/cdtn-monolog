import { IDataFrame } from "data-forge";

import * as datasetUtil from "../reader/dataset";
import { urlToPath } from "../reader/readerUtil";
import { CovisiteReport } from "./reports";

const reportType = "covisit";

// number of covisited links to be added to each content report
const LINK_LIMIT = 6;

// minimum covisits to consider as actual link
// 5 means : a minimum of 5 unique visits where two contents were viewed
const MIN_OCC = 5;
const analyse = (
  dataset: IDataFrame,
  minOcc: number = MIN_OCC,
  linkLimit: number = LINK_LIMIT,
  reportId: string = new Date().getTime().toString()
): CovisiteReport[] => {
  // FIXME avoid using to array
  const visits = datasetUtil.getVisits(dataset).toArray();

  const uniqueViews = visits.map((v) =>
    datasetUtil.toUniqueViews(v).deflate((a: any) => a.url)
  );

  // unique key to represent link between a & b
  const toKey = (a: string, b: string) => (a < b ? `${a}__${b}` : `${b}__${a}`);

  const graph = new Map();

  uniqueViews.forEach((vv) => {
    const visitViews = vv.toArray();
    if (visitViews.length > 1) {
      // visitViews.map((v) => console.log(v.toString()));
      // get all pairs of contents A/B
      const covisits = visitViews.reduce(
        (acc: string[][], a: string, i: number) => {
          acc.push(...visitViews.slice(i + 1).map((b: string) => [a, b]));
          return acc;
        },
        []
      );

      // TODO use proper edge type rather than array
      covisits.forEach(([a, b]: string[]) => {
        const key = toKey(a, b);
        if (!graph.has(key)) {
          graph.set(key, { count: 1, nodes: [a, b] });
        } else {
          graph.get(key).count++;
        }
      });
    }
  });

  const contents = new Map<string, Map<string, number>>();

  graph.forEach((edge) => {
    const [a, b] = edge.nodes;

    const addToContent = (x: string, y: string) => {
      if (!contents.has(x)) {
        contents.set(x, new Map());
      }
      contents.get(x)?.set(y, edge.count);
    };

    // only keep if count is more than MIN_OCC
    if (edge.count >= minOcc) {
      addToContent(a, b);
      addToContent(b, a);
    }
  });

  const sortedContents = new Map<string, Map<string, number>>();
  // sort contents by count
  contents.forEach((counts, url) => {
    const sorted = new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
    sortedContents.set(url, sorted);
  });

  const docs: CovisiteReport[] = [];

  sortedContents.forEach((counts, url) => {
    const content = urlToPath(url);

    const links = Array.from(counts)
      .slice(0, linkLimit)
      .map(([link, count]) => {
        return {
          count,
          link: urlToPath(link),
        };
      });
    docs.push({ content, links, reportId, reportType });
  });

  return docs;
};

export { analyse, reportType };
