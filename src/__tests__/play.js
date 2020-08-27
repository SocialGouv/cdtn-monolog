import * as dataForge from "data-forge";
import * as fs from "fs";
import fetch from "node-fetch";
import PQueue from "p-queue";

// import { ingest } from "../ingestion/ingester";
import * as datasetUtil from "../dataset";
// import * as Suggestion from "../analysis/suggestion";
import { esClient } from "../esConf";
import * as Reader from "../reader";

// const logFile = "/Users/remim/tmp/logs-30.csv";
const logFile = "/Users/remim/tmp/3months/logs-may.csv";

// const dumpFile = "/Users/remim/tmp/ingest-test/2020-04-23.json";

// eslint-disable-next-line no-unused-vars
const main = async () => {
  const data = await Reader.readFromElastic(
    esClient,
    31,
    new Date("2020-06-01")
  );
  console.log(data.count());
  data.asCSV().writeFileSync(logFile);

  // const data = await Reader.readFromFile(logFile);

  console.log(
    data
      .groupBy(function (row) {
        return row.logfile;
      })
      .select((group) => {
        return {
          count: group.count(),
          day: group.first().logfile,
        };
      })
      .inflate()
      .toString()
  );
  // const suggestions = Suggestion.analyse(data);
  // console.log(JSON.stringify(suggestions, null, 1));

  // ingest(esClient, dumpFile, "logs");

  // check index
};

const read = (m) =>
  Reader.readFromFile(`/Users/remim/tmp/3months/logs-${m}.csv`);

// eslint-disable-next-line no-unused-vars
const covisiteAnalysis = async () => {
  const m = "may";
  console.log(m);
  const data = await read(m);
  // const data = await read("july");
  // const august = await read("august");

  const getViewPerType = (d) =>
    d
      .groupBy((row) => row.type)
      .select((group) => {
        return {
          count: group.count(),
          type: group.first().type,
        };
      })
      .inflate();

  const discardSingleAction = (d) => {
    const visits = datasetUtil.getVisits(d).toArray();
    const longVisits = visits.filter((v) => v.count() > 2);
    // console.log(dataForge.concatSeries(longVisits).count());

    // console.log(visits.length);
    // console.log(longVisits.length);
    return dataForge.concatSeries(longVisits);
  };

  console.log(getViewPerType(data).toString());
  console.log(getViewPerType(discardSingleAction(data)).toString());
};

const formatToPercent = (num) =>
  Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    style: "percent",
  });

const covisitsRatios = async (data, n) => {
  const relatedActions = data.where((a) => a.type == "select_related");

  const min = 5;
  const mostRelatedUrls = relatedActions
    .groupBy((row) => row.url)
    .select((group) => {
      const covisits = group.where((a) => a.recoType == "covisits").count();
      const search = group.where((a) => a.recoType == "search").count();
      const ratioCovisits = formatToPercent(covisits / (covisits + search));
      return {
        covisits,
        ratioCovisits,
        search,
        total: group.count(),
        url: group.first().url,
      };
    })
    .inflate()
    .where((g) => g.total > min && g.covisits > 0)
    .orderByDescending((r) => r.total);

  console.log(mostRelatedUrls.head(n).toString());

  const covisitsCount = mostRelatedUrls.getSeries("covisits").sum();
  const searchesCount = mostRelatedUrls.getSeries("search").sum();
  //const total = mostRelatedUrls.getSeries("total").sum();
  const total = covisitsCount + searchesCount;
  const covisitsRatio = formatToPercent(covisitsCount / total);
  const searchesRatio = formatToPercent(searchesCount / total);

  const covisitsAbs = data.where((a) => a.recoType == "covisits").count();
  const searchAbs = data.where((a) => a.recoType == "search").count();

  console.log(
    JSON.stringify(
      {
        covisitsAbs,
        covisitsCount,
        covisitsRatio,
        searchAbs,
        searchesCount,
        searchesRatio,
        total,
      },
      null,
      2
    )
  );
};

// eslint-disable-next-line no-unused-vars
const analyseAugust = async () => {
  const data = await read("august");

  /*
  data.where(
    (a) =>
      a.url ==
      "https://code.travail.gouv.fr/fiche-service-public/contrat-de-travail-du-salarie-a-domicile-services-a-la-personne"
  );
  */

  console.log("All august");
  // covisitsRatios(data);

  const runOnPeriod = (start, end, n = 30) => {
    console.log(`Start : ${start}`);
    console.log(`End : ${end}`);
    const range = data.where(
      (a) =>
        a.lastActionTimestamp > new Date(start).getTime() / 1000 &&
        a.lastActionTimestamp < new Date(end).getTime() / 1000
    );
    covisitsRatios(range, n);
  };

  runOnPeriod("2020/07/30", "2020/08/26", 200);
  runOnPeriod("2020/07/30", "2020/08/08");
  runOnPeriod("2020/08/09", "2020/08/15");
  runOnPeriod("2020/08/16", "2020/08/22");
  runOnPeriod("2020/08/23", "2020/08/25");
};

const knownSearches = new Map();

const searchType = "search";
const visitType = "visit_content";

const host = "https://api-master-code-travail.dev.fabrique.social.gouv.fr";
const path = "/api/v1/search";

const triggerSearch = (query) => {
  const url = `${host}${path}?q=${escape(query)}`;

  return fetch(url)
    .then((res) => res.json())
    .catch((err) => console.log(err));

  // const docs = result.documents;
  // return { docs, query };
};

// eslint-disable-next-line no-unused-vars
const treatSearchVisit = async (visit) => {
  const actions = visit.where((a) => [searchType, visitType].includes(a.type));

  // if search is not known already,
  // we trigger a call to our seach engine in order
  // to retrieve its results, and we keep it in
  // a cache for other visits

  const searches = new Set(
    actions
      .getSeries("query")
      .toArray()
      .filter((a) => a)
  );

  for (const s of Array.from(searches)) {
    if (!knownSearches.has(s)) {
      console.log(s);
      const docs = await triggerSearch(s);
      // console.log(docs);
      knownSearches.set(s, docs);
    }
  }

  /*
  await Array.from(searches).forEach(async (s) => {
    if (!knownSearches.has(s)) {
      console.log(s);
      const docs = await triggerSearch(s);
      console.log(docs);
      knownSearches.set(s, docs);
    }
  });

  console.log(JSON.stringify(knownSearches, null, 2));
  */

  // we check the user selection and
  // we increment the corresponding search entry

  // some possible corner cases here :
  // visit before search
  // content not in the search result
  // ...

  // console.log(actions.toString());
};

const buildCache = async (data) => {
  // get all search queries and build a cache of the responses
  // data.where((a) => a.type == "search").getSeries("query");

  const pqueue = new PQueue({ concurrency: 20 });

  const searches = new Set(
    data
      .where((a) => a.type == "search")
      .getSeries("query")
      .toArray()
      .filter((a) => a)
    // .slice(0, 10)
  );

  const pSearches = Array.from(searches).map((query) =>
    pqueue.add(() =>
      triggerSearch(query).then((json) => ({
        // use base64 to reduce cache size
        documents: Buffer.from(JSON.stringify(json.documents)).toString(
          "base64"
        ),
        query,
      }))
    )
  );

  const results = await Promise.all(pSearches);

  await pqueue.onIdle();

  return results;
};

const readCache = (file) => {
  const cacheB64 = JSON.parse(fs.readFileSync(file));

  return cacheB64.map(({ query, documents }) => ({
    documents: JSON.parse(new Buffer(documents, "base64")),
    query,
  }));
};

const evaluate = async () => {
  // todo : use june to september
  const data = await read("august");

  const cache = await buildCache(data);

  const f = "cache-master.json";

  fs.writeFileSync(f, JSON.stringify(cache, null, 2));

  const cacheR = readCache(f);

  console.log(cacheR[0]);

  /*
  const visits = datasetUtil.getVisits(data);

  await visits
    .toArray()
    // at least on search
    .filter((v) => v.where((a) => a.type == "search").count() > 0)
    .slice(0, 10)
    .forEach(async (v) => await treatSearchVisit(v));

  console.log(JSON.stringify(knownSearches, null, 2));
  */
};

// main()
// .then(() => covisiteAnalysis())
// analyseAugust()
evaluate()
  .then(() => console.log("done"))
  .catch((err) => console.log(err));
