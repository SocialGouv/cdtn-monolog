// analyse function takes a dataset and return documents
// analyser has a mappings
import * as datasetUtil from "../dataset";
import * as util from "../util";

// number of covisited links to be added to each content report
const LINK_LIMIT = 6;

// minimum covisits to consider as actual link
// 5 means : a minimum of 5 unique visits where two contents were viewed
const MIN_OCC = 5;

// we provide a configurable function
const analyseNoConf = (minOcc, linkLimit) => (dataset) => {
  // FIXME avoid using to array
  const visits = datasetUtil.getVisits(dataset).toArray();

  const uniqueViews = visits.map((v) =>
    datasetUtil.toUniqueViews(v).deflate((a) => a.url)
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
    if (edge.count >= minOcc) {
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

  const docs = [];
  sortedContents.forEach((counts, url) => {
    const content = util.urlToPath(url);

    const links = Array.from(counts)
      .slice(0, linkLimit)
      .map(([link, count]) => {
        return {
          link: util.urlToPath(link),
          count,
        };
      });
    docs.push({ content, links });
  });

  return docs;
};

// configured function
const analyse = analyseNoConf(MIN_OCC, LINK_LIMIT);

const query = {
  match_all: {},
};

export { analyseNoConf, analyse, query };
