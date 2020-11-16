// @ts-nocheck
/* eslint-disable no-unused-vars */
import "data-forge-fs";

import { getRouteBySource } from "@socialgouv/cdtn-sources";
import * as dataForge from "data-forge";
import * as fs from "fs";
import fetch from "node-fetch";
import PQueue from "p-queue";
import * as readline from "readline";

// import { ingest } from "../ingestion/ingester";
import * as datasetUtil from "../dataset";
// import * as Suggestion from "../analysis/suggestion";
import { esClient, LOG_INDEX } from "../esConf";
import * as Reader from "../reader";
import { actionTypes } from "../util";

// const logFile = "/Users/remim/tmp/logs-30.csv";

// const dumpFile = "/Users/remim/tmp/ingest-test/2020-04-23.json";

const main = async () => {
  console.log(new Date());

  let data = await Reader.readFromElastic(
    esClient,
    LOG_INDEX,
    // 104,
    // new Date("2020-09-12")
    new Date("2020-10-19"),
    50,
    // [actionTypes.selectRelated, actionTypes.visit]
    [actionTypes.selectRelated]
  );
  // console.log(data.count());

  // we unfold the result selection object in two columns
  // const resultSelection = data
  // .where((a) => a.type == selectResultType)
  // .getSeries("resultSelection");

  data = data.withSeries({
    resultSelectionAlgo: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.algo : undefined
      ),
    resultSelectionUrl: (df) =>
      df.select((row) =>
        row.resultSelection ? row.resultSelection.url : undefined
      ),
  });

  // console.log(data.getSeries("resultSelectionAlgo").toString());

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

const covisiteAnalysis = async () => {
  const m = "4months";
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
  const structuredURL = relatedActions
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
    .inflate();

  const mostRelatedUrls = structuredURL
    .where((g) => g.total > min && g.covisits > 0)
    .orderByDescending((r) => r.total);

  console.log(mostRelatedUrls.head(n).toString());

  const anomalies = structuredURL
    .where((g) => {
      const covRatio = g.covisits / g.total || 0;
      return g.total > min && (covRatio < 0.3 || covRatio > 0.7);
    })
    .orderByDescending((r) => r.total);

  console.log(anomalies.head(n).toString());

  const toCheckCov = structuredURL
    .where((g) => {
      const covRatio = g.covisits / g.total || 0;
      return g.total > 5 && g.search + g.covisits && covRatio < 0.25;
    })
    .orderByDescending((r) => r.total);
  console.log(toCheckCov.head(n).toString());

  const toCheckSearch = structuredURL
    .where((g) => {
      const searchRatio = g.search / g.total || 0;
      return g.total > 5 && g.search + g.covisits && searchRatio < 0.25;
    })
    .orderByDescending((r) => r.total);
  console.log(toCheckSearch.head(n).toString());

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

const analyseAugust = async () => {
  const data = await read("4months");

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

  // runOnPeriod("2020/07/30", "2020/09/12", 200);
  // runOnPeriod("2020/07/30", "2020/08/22");
  // runOnPeriod("2020/08/23", "2020/09/12");
  runOnPeriod("2020/09/01", "2020/10/20");

  /*
  runOnPeriod("2020/07/30", "2020/08/08");
  runOnPeriod("2020/08/09", "2020/08/15");
  runOnPeriod("2020/08/16", "2020/08/22");
  runOnPeriod("2020/08/23", "2020/08/29");
  runOnPeriod("2020/08/30", "2020/09/05");
  runOnPeriod("2020/09/06", "2020/09/12");
  */
};

const knownSearches = new Map();

const searchType = "search";
const visitType = "visit_content";
const selectResultType = "select_result";

// const host = "https://api-master-code-travail.dev.fabrique.social.gouv.fr";
const host = "http://localhost:1337";
const path = "/api/v1/search";

const triggerSearch = (query) => {
  const url = `${host}${path}?q=${encodeURIComponent(query)}`;

  return fetch(url)
    .then((res) => res.json())
    .catch((err) => console.log(err));

  // const docs = result.documents;
  // return { docs, query };
};

const treatSearchVisit = async (visit) => {
  const actions = visit.where((a) =>
    [searchType /*, selectResultType*/].includes(a.type)
  );

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
      .map((q) => q.toLowerCase())
    // .slice(0, 100)
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

const readCache = async (file) => {
  const readInterface = readline.createInterface({
    crlfDelay: Infinity,
    input: fs.createReadStream(file),
  });

  const cacheB64 = [];

  for await (const line of readInterface) {
    cacheB64.push(JSON.parse(line));
  }

  const cacheObj = cacheB64.map(({ query, documents }) => ({
    documents: JSON.parse(new Buffer(documents, "base64")),
    query,
  }));

  const groups = new Map();

  cacheB64.forEach(({ query, documents }) => {
    if (!groups.has(documents)) {
      groups.set(documents, [query]);
    } else {
      groups.get(documents).push(query);
    }
  });

  const queryGroups = [...groups.values()];

  const resultCache = new Map();
  cacheObj.forEach(({ query, documents }) => resultCache.set(query, documents));

  return { queryGroups, resultCache };
};

const printQueryGroup = (queryGroup) => {
  console.log(
    JSON.stringify(
      {
        dcg: queryGroup.dcg,
        idcg: queryGroup.idcg,
        ndcg: queryGroup.ndcg,
        queries: Array.from(queryGroup.queries),
        queriesCount: queryGroup.queriesCount,
        results: Array.from(queryGroup.results),
        selectionsCount: queryGroup.selectionsCount,
      },
      null,
      2
    )
  );
};

const computeNDCG = (results) => {
  const dcg = [...results.values()].reduce(
    (acc, val, index) => acc + val.count / Math.log2(index + 1 + 1),
    0
  );

  const idcg = [...results.values()]
    .sort((a, b) => b.count - a.count)
    .reduce((acc, val, i) => acc + val.count / Math.log2(i + 1 + 1), 0);

  const ndcg = dcg / idcg;

  return { dcg, idcg, ndcg };
};

const evaluate = async () => {
  // todo : use june to september
  const data = await read("3months");
  // const data = await read("august");

  const f = "cache-master-3months.json";

  /*
  const cache = await buildCache(data);
  var writer = fs.createWriteStream(f);
  cache.forEach((entry) => {
    writer.write(JSON.stringify(entry));
    writer.write("\n");
  });
  writer.end();
  */

  // give some time to write the file
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // exit(1);

  const { queryGroups, resultCache } = await readCache(f);

  // console.log(Array.from(resultCache)[0]);

  // -- Create map of [query group] / number of searches / results with clicks

  const visits = datasetUtil.getVisits(data);

  // we init the utility structures

  // a map to get the query group id from a raw query
  // console.log(queryGroups);
  const queryMap = new Map(
    queryGroups.flatMap((queryGroup, i) =>
      queryGroup.map((query) => [query, i])
    )
  );

  // console.log([...queryMap]);
  console.log(resultCache.get("départ de l'entreprise"));

  // return;

  // console.log(queryMap.get("mannequins"));

  // a map that store each query group with : queries and occurences / results and clicks
  const counts = new Map(
    queryGroups.map((queryGroup, i) => [
      i,
      {
        queries: new Map(queryGroup.map((q) => [q, 0])),
        results: new Map(
          resultCache
            .get(queryGroup[0])
            .map(({ algo, source, slug }) => [
              "/" + getRouteBySource(source) + "/" + slug,
              { algo, count: 0 },
            ])
        ),
      },
    ])
  );

  // console.log(counts.get(1));
  // console.log(JSON.stringify([...counts.get(1).results], null, 2));

  const basePath = "https://code.travail.gouv.fr/";

  await visits
    .toArray()
    // at least one search
    .filter((v) => v.where((a) => a.type == searchType).count() > 0)
    // .slice(0, 10)
    // to build the cache
    // .forEach(async (v) => await treatSearchVisit(v));
    // to count and evaluate
    .forEach((v) => {
      const actions = v.where((a) =>
        [searchType, selectResultType].includes(a.type)
      );

      // remove duplicates
      const searches = Array.from(
        new Set(
          actions
            .getSeries("query")
            .toArray()
            .filter((q) => q)
            .map((q) => q.toLowerCase())
        )
      );

      // we increment query count and retrieve results lists
      const results = searches.map((q) => {
        const group = queryMap.get(q);
        const count = counts.get(group);

        if (!count) {
          console.log("Cannot find results for query : " + q);
          console.log(group);
          return new Map();
        }

        count.queries.set(q, count.queries.get(q) + 1);

        return count.results;
      });

      const urlSelected = new Set(
        actions
          .where((a) => a.type == selectResultType)
          .getSeries("resultSelectionUrl")
          .toArray()
          .filter((q) => q)
      );

      urlSelected.forEach((url) => {
        for (const r of results) {
          if (r.has(url)) {
            const obj = r.get(url);
            r.set(url, { algo: obj.algo, count: obj.count + 1 });
          }
        }

        if (url == "/information/elections-du-cse-nouveautes-covid-19") {
          console.log("selection not in results : " + url);
          // console.log(results.map((r) => r.keys()));
          // console.log(url);
        }
      });
    });

  // count queries and results
  [...counts.values()].forEach((obj) => {
    obj.queriesCount = [...obj.queries.values()].reduce((acc, i) => i + acc, 0);
    obj.selectionsCount = [...obj.results.values()].reduce(
      (acc, i) => i.count + acc,
      0
    );
    Object.assign(obj, computeNDCG(obj.results));
  });

  /*
  const totalPQ = [...counts.values()]
    .map((obj) => {
      const v = obj.results.values().next().value;
      if (v && v.algo != "pre-qualified") {
        return obj.queriesCount;
      } else {
        return 0;
      }
    })
    .reduce((acc, a) => acc + a, 0);
  console.log("Total PQ : " + totalPQ);
  */

  const groups = [...counts.values()].map((queryGroup) => {
    const { dcg, idcg, ndcg, queriesCount, selectionsCount } = queryGroup;
    const v = queryGroup.results.values().next().value;
    const type = v && v.algo != "pre-qualified" ? "search" : "pre-qualified";

    const queries = (Array.from(queryGroup.queries) || [])
      .map((q) => `${q[0]} - ${q[1]}`)
      .join(",");

    const results = (Array.from(queryGroup.results) || [])
      .map((r) => `${r[0]} - ${JSON.stringify(r[1])}`)
      .join(",");

    return {
      dcg,
      idcg,
      ndcg,
      queries,
      queriesCount,
      results,
      selectionsCount,
      type,
    };
  });

  const queryClusters = new dataForge.DataFrame(groups);

  /*
  printQueryGroup(counts.get(1));
  printQueryGroup(counts.get(10));
  printQueryGroup(counts.get(20));
  printQueryGroup(counts.get(30));
  */

  // console.log(new Date());

  queryClusters.asCSV().writeFileSync("queryClusters.csv");
};

const play = () =>
  new Promise((resolve) => {
    const df = dataForge.readFileSync("queryClusters.csv").parseCSV();

    const sum = (type, column) =>
      df
        .where((row) => row.type == type)
        .getSeries(column)
        .parseInts()
        .sum();

    const prequalifiedRequests = sum("pre-qualified", "queriesCount");
    const prequalifiedSelections = sum("pre-qualified", "selectionsCount");
    const prequalifiedTauxSelection = formatToPercent(
      prequalifiedSelections / prequalifiedRequests
    );

    const searchRequests = sum("search", "queriesCount");
    const searchSelections = sum("search", "selectionsCount");
    const searchTauxSelection = formatToPercent(
      searchSelections / searchRequests
    );

    // .where((row) => row.type == "search")
    // .where((row) => row.type == "pre-qualified")
    // .getSeries("queriesCount")
    // .forEach((count) => parseInt(count))
    // .parseInts()
    // .head(5)
    // .sum();

    // const prequalifiedSelections = df;

    // const searchSelections;
    // const searchRequests;

    /*
    console.log(
      df
        .where((row) => row.type == "pre-qualified")
        .head(3)
        .toString()
    );
    */

    console.log({
      prequalifiedRequests,
      prequalifiedSelections,
      prequalifiedTauxSelection,
      searchRequests,
      searchSelections,
      searchTauxSelection,
    });

    df.where((row) => row.queries.split(",").length > 2)
      .orderByDescending((row) => row.queriesCount)
      .head(100)
      .forEach((row) => {
        console.log(JSON.stringify(row.queries, null, 2));
      });

    console.log(df.count());

    resolve();
  });

// main()
// covisiteAnalysis();

analyseAugust()
  // .then(() => evaluate())

  // evaluate()
  // play()
  .then(() => console.log("done"))
  .catch((err) => console.log(err));
