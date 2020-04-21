import { esClient } from "./elastic";
import { queryLastDays } from "./local_dump";
import * as dataForge from "data-forge";
import "data-forge-fs";
import { default as Analyzer } from "./analysis/Analyzer";
import { Dataset } from "./data/Dataset";

// get logs and write them to offline file
// const output = "logs.csv";
const output = "/Users/remim/tmp/30-days-es-logs.csv";

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
const actions = dataForge.readFileSync(output).parseCSV();
const dataset = new Dataset(actions);
const analyser = new Analyzer(dataset);

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

// get connection graph log report

const covisits = analyser.covisitGraph();

const prefix = "https://code.travail.gouv.fr/";

covisits.forEach((counts, url) => {
  console.log(`### ${url.slice(prefix.length)}`);

  Array.from(counts)
    .slice(0, 6)
    .forEach(([link, count]) => {
      //   console.log(link);
      //   console.log(count);
      console.log(`- ${count} : ${link.slice(prefix.length)}`);
    });
});

// console.log(covisits);
// console.log(covisits.get(content));
