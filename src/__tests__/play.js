import * as Reader from "../reader";
import * as datasetUtil from "../dataset";
// import * as Suggestion from "../analysis/suggestion";
import { esClient } from "../esConf";
import { parse } from "../ingestion/ingester";
import { dumpfile } from "./util";
import * as dataForge from "data-forge";

// const logFile = "/Users/remim/tmp/logs-30.csv";
// const logFile = "/Users/remim/tmp/logs-3.csv";

const logFile = "/Users/remim/tmp/test-virginie.json";

const queries_ = [
  "licenciement pour motif economique",
  "licenciement economique",
  "licenciement economique procedure",
];

const queries = [
  "licenciement economique",
  "licenciement",
  "preavis cdi",
  "convocation entretien prealable de licenciement",
  "entretien prealable au licenciement",
  "entreprises en difficulte",
  "comment calculer le montant de l'indemnite de licenciement",
  "indemnites de licenciement",
  "entretien prealable",
  "duree de preavis",
  "licenciement pour motif economique",
  "licenciement economique procedure",
  "indemnites",
  "procedure de licenciement",
  "lettre de licenciement",
  "licenciement sans cause reelle et serieuse",
  "modalites de calcul indemnites de licenciement",
  "modele convocation entretien prealable licenciement",
  "reclassement",
  "pse",
];

const buildGraph = (dataset) => {
  const visits = datasetUtil.getVisits(dataset).toArray();

  const matchingVisites = visits.filter(
    (v) =>
      v
        .where(
          (a) =>
            a.query &&
            queries.includes(
              a.query.toLowerCase().replace("é", "e").replace("è", "e")
            )
        )
        .count() > 0
  );

  const uniqueViews = matchingVisites.map((v) => datasetUtil.toUniqueViews(v));

  const nodes = dataForge.DataFrame.concat(uniqueViews)
    .groupBy((a) => a.url)
    .select((group) => ({
      url: group.first().url.slice("https://code.travail.gouv.fr/".length),
      count: group.count(),
    }))
    .inflate()
    .toArray()
    .map((content, i) => {
      content.id = i;
      return content;
    });

  const edges = new Map();

  const toKey = (a, b) => (a < b ? `${a}__${b}` : `${b}__${a}`);

  uniqueViews.forEach((vv) => {
    const visitViews = vv.deflate((a) => a.url).toArray();
    if (visitViews.length > 1) {
      // visitViews.map((v) => console.log(v.toString()));
      // get all pairs of contents A/B
      const covisits = visitViews.reduce((acc, a, i) => {
        acc.push(...visitViews.slice(i + 1).map((b) => [a, b]));
        return acc;
      }, []);

      covisits.forEach(([a, b]) => {
        const key = toKey(a, b);
        if (!edges.has(key)) {
          edges.set(key, { nodes: [a, b], count: 1 });
        } else {
          edges.get(key).count++;
        }
      });
    }
  });

  const nodesMap = new Map();
  nodes.forEach((node) => {
    nodesMap.set(node.url, node);
  });

  const lines = [];
  lines.push("graph");
  lines.push("[");

  nodes
    .filter((c) => c.count >= 2)
    .forEach((content) => {
      lines.push("  node");
      lines.push("  [");
      lines.push(`    id ${content.id}`);
      lines.push(`    label "${content.url}"`);
      lines.push(`    weight ${content.count}`);
      lines.push("  ]");
    });
  // console.log(nodesMap);

  edges.forEach((edge) => {
    const [a, b] = edge.nodes;
    // console.log(a);
    lines.push("  edge");
    lines.push("  [");
    lines.push(
      `    source ${
        nodesMap.get(a.slice("https://code.travail.gouv.fr/".length)).id
      }`
    );
    lines.push(
      `    target ${
        nodesMap.get(b.slice("https://code.travail.gouv.fr/".length)).id
      }`
    );
    lines.push(`    value ${edge.count}`);
    lines.push("  ]");
  });
  lines.push("]");

  console.log(lines.join("\n"));

  /*

  const output = counts
    .where((content) => content.count > 3)
    .orderByDescending((content) => content.count);

  output.asCSV().writeFileSync("licenciement.csv");

  console.log("| contenu        | vues           |");
  console.log("| -------        | :----        : |");
  output.toArray().forEach((element) => {
    console.log(`|${element.url}|${element.count}|`);
  });
  // console.log(uniqueViews[0].toString());
  console.log(counts.count());
  // Array.from(Array(20).keys()).forEach((i) =>
  // console.log(uniqueViews[i].toString())
  // );
  */
};

const main = async () => {
  // const data = await Reader.readFromElastic(esClient, 32, new Date());
  // data.asCSV().writeFileSync(logFile);
  const data = await Reader.readFromFile(logFile);

  // console.log(data.count());
  buildGraph(data);
  // console.log(data.where((a) => a.query).count());
  // console.log(data.take(10).toString());
  // console.log(data.getColumnNames());

  // const actions = parse(dumpfile);

  // console.log(actions.filter((a) => a.query != undefined)[0]);

  // const suggestions = Suggestion.analyse(data);
  // console.log(JSON.stringify(suggestions, null, 1));

  // ingest(esClient, dumpFile, "logs");

  // check index
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.log(err));
