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

console.log(
  analyser
    .viewCount()
    .orderByDescending((row) => row.count)
    .take(20)
    .toString()
);

// console.log(actions);

// given log range :

// get visits log report

// get suggestions log report

// get connection graph log report
