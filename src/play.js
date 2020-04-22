import { esClient } from "./elastic";
import { queryLastDays } from "./local_dump";
import * as dataForge from "data-forge";
import "data-forge-fs";
import { default as Analyzer } from "./analysis/Analyzer";
import { Dataset } from "./data/Dataset";
import { CovisitReporter } from "./report/CovisitReporter";

try {
  // get logs and write them to offline file
  const OUTPUT = process.env.OUTPUT || "logs.csv";
  // const output = "/Users/remim/tmp/30-days-es-logs.csv";

  /*
queryLastDays(esClient, 0)
  .then((actions) => {
    console.log(`${actions.length} actions read.`);
    // console.log(JSON.stringify(actions, null, 2));
    new dataForge.DataFrame(actions).asCSV().writeFileSync(output);
  })
  .catch((err) => console.log(err));
  */

  // read logs from file
  const actions = dataForge.readFileSync(OUTPUT).parseCSV();
  const dataset = new Dataset(actions);
  const analyser = new Analyzer(dataset);

  // console.log(dataset.getVisits()[0].dataFrame.toString());

  // given log range :

  // get visits log report

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
  const 


  // get connection graph log report
  const covisits = analyser.covisitGraph();

  // console.log(covisits);
  // console.log(covisits.get(content));

  // write report to ES

  const cvReport = new CovisitReporter(esClient);
  // cvReport.printReport(covisits);
  cvReport.publishReport(covisits);
} catch (err) {
  console.log(err);
}
