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

  const counts = dataForge.DataFrame.concat(uniqueViews)
    .groupBy((a) => a.url)
    .select((group) => ({
      url: group.first().url.slice("https://code.travail.gouv.fr/".length),
      count: group.count(),
    }))
    .inflate();

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
