import { esClient } from "./elastic";
import { queryLastDays } from "./local_dump";
import * as dataForge from "data-forge";
import "data-forge-fs";
import { default as Analyzer } from "./analysis/Analyzer";
import { Dataset } from "./data/Dataset";
import { CovisitReporter } from "./report/CovisitReporter";
import { PopularityReporter } from "./report/PopularityReporter";

const main = async () => {
  // get logs and write them to offline file
  const OUTPUT = process.env.OUTPUT || "logs.csv";
  //   const OUTPUT = "/Users/remim/tmp/30-days-es-logs.csv";

  //   /*
  await queryLastDays(esClient, 40)
    .then((actions) => {
      console.log(`${actions.length} actions read.`);
      // console.log(JSON.stringify(actions, null, 2));
      new dataForge.DataFrame(actions).asCSV().writeFileSync(OUTPUT);
    })
    .catch((err) => console.log(err));
  // */

  // read logs from file
  const actions = dataForge.readFileSync(OUTPUT).parseCSV();

  // dateset reference
  const dataset = new Dataset(actions);

  const analyser = new Analyzer(dataset);

  //   console.log(dataset.getVisits()[0].dataFrame.toString());
  const diff = analyser.popularity();
  console.log(diff.start);
  console.log(diff.pivot);
  console.log(diff.end);
  const popularityReporter = new PopularityReporter(esClient);
  await popularityReporter.publishReport(diff);

  // given log range :

  // get popular content

  /*
console.log(
  analyser
    .viewCount()
    .orderByDescending((row) => row.count)
    .take(20)
    .toString()
);
*/

  // get suggestions log report

  // get connection graph log report
  //   const covisits = analyser.covisitGraph();

  // console.log(covisits);
  // console.log(covisits.get(content));

  // write report to ES

  /*
  const cvReport = new CovisitReporter(esClient);
  // cvReport.printReport(covisits);
  cvReport.publishReport(covisits);
  */
};

main().catch((err) => console.log(err));
