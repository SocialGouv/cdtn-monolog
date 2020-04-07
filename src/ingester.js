import { convertLogs } from "./matomo_converter";
import { logger } from "./logger";
import { Client } from "@elastic/elasticsearch";

import commander from "commander";
import { commaSeparatedList } from "./utils";

async function main(path, date) {
  const ELASTICSEARCH_URL =
    process.env.ELASTICSEARCH_URL || "http://localhost:9200";
  const LOG_INDEX_NAME = "logs";
  const API_KEY = process.env.API_KEY || null;

  // const path = "/Users/remim/dev/cdtn/cdtn-monolog/backup-logs/scripts/";

  // convert matomo logs to actions
  const logPath = `${path}${date}.json`;
  const actions = convertLogs(logPath);

  // push actions as batches to ES
  const auth = API_KEY ? { apiKey: API_KEY } : null;
  const esClientConfig = {
    node: `${ELASTICSEARCH_URL}`,
    auth,
  };
  const client = new Client(esClientConfig);

  // we ensure index exists other we create it
  const { body } = await client.indices.exists({ index: LOG_INDEX_NAME });

  const mappings = {
    properties: {
      logfile: {
        type: "keyword",
      },

      type: {
        type: "keyword",
      },

      // unique visit id
      uvi: {
        type: "keyword",
      },

      idVisit: {
        type: "keyword",
      },

      feedbackType: {
        type: "keyword",
      },

      outilEvent: {
        type: "keyword",
      },

      outilAction: {
        type: "keyword",
      },

      outil: {
        type: "keyword",
      },

      lastActionDateTime: {
        type: "keyword",
      },

      lastActionTimestamp: {
        type: "date",
      },

      query: {
        type: "keyword",
      },

      referrerName: {
        type: "keyword",
      },

      referrerTypeName: {
        type: "keyword",
      },

      resultSelection: {
        type: "object",
      },

      suggestionSelection: {
        type: "keyword",
      },

      suggestionPrefix: {
        type: "keyword",
      },

      // todo we might be able to use date type ?
      serverTimePretty: {
        type: "keyword",
      },
      timeSpent: {
        type: "long",
      },

      timestamp: {
        type: "date",
      },

      url: {
        type: "keyword",
      },

      visited: {
        type: "keyword",
      },
    },
  };

  if (!body) {
    try {
      await client.indices.create({
        index: LOG_INDEX_NAME,
        body: {
          settings: {},
          mappings: mappings,
        },
      });
      logger.info(`Index ${LOG_INDEX_NAME} created.`);
    } catch (error) {
      logger.error("Index creation", error);
    }
  } else {
    logger.info(`Index ${LOG_INDEX_NAME} found.`);
    try {
      await client.indices.putMapping({
        index: LOG_INDEX_NAME,
        body: mappings,
      });
      logger.info(`Mapping updated for ${LOG_INDEX_NAME}.`);
    } catch (error) {
      logger.error("Index mapping update", error);
    }
  }

  // shameless copy paste from stack overflow as non critical and
  // to avoid adding yet another dependency
  function hash(s) {
    return s.split("").reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  function mapAction({
    idVisit,
    feedbackType,
    lastActionDateTime,
    lastActionTimestamp,
    outilEvent,
    outil,
    outilAction,
    suggestionPrefix,
    query,
    referrerName,
    referrerTypeName,
    resultSelection,
    serverTimePretty,
    suggestionSelection,
    timeSpent,
    timestamp,
    type,
    url,
    visited,
  }) {
    const header = { index: { _index: LOG_INDEX_NAME, _type: "_doc" } };
    // unique visit id
    const uvi = hash(`${idVisit}-${lastActionDateTime}`);
    const obj = {
      type,
      uvi,
      idVisit,
      feedbackType,
      lastActionDateTime,
      lastActionTimestamp,
      outilEvent,
      outilAction,
      outil,
      suggestionPrefix,
      query,
      referrerName,
      referrerTypeName,
      resultSelection,
      serverTimePretty,
      suggestionSelection,
      timeSpent,
      timestamp,
      url,
      visited,
      logfile: date,
    };

    // logger.info(JSON.stringify(obj, null, 2));

    return [header, obj];
  }

  // bulk insert
  async function insertActions(actions) {
    try {
      const resp = await client.bulk({
        index: LOG_INDEX_NAME,
        body: actions.map(mapAction).flat(),
      });

      if (resp.body.errors) {
        resp.body.items.forEach((element) => {
          if (element.index.status == 400) {
            logger.error(
              `Error during insertion : ${element.index.error.reason}`
            );
          }
        });
      }
    } catch (error) {
      logger.error("Index actions", error);
    }
  }

  async function batchInsert(actions, size = 1000) {
    // number of batches
    const n = Math.ceil(actions.length / size);
    await [...Array(n).keys()].forEach(async (i) => {
      const batch = actions.slice(i * size, (i + 1) * size);
      await insertActions(batch);
    });
    logger.info(`${actions.length} actions indexed.`);
  }

  // split actions and insert as batches
  await batchInsert(actions);
}

const cli = new commander.Command();

cli
  .option("-p, --path <path>", "JSON dump path", "/data/")
  .requiredOption(
    "-d, --days <days>",
    "Days to dump from Matomo, separated by commas, example : -d 2019-11-19,2019-11-20",
    commaSeparatedList,
    [new Date(Date.now() - 86400000).toISOString().split("T")[0]]
  );

cli.parse(process.argv);

cli.days.forEach(async (day) => {
  logger.info("Indexing " + day);
  await main(cli.path, day).catch((response) => {
    if (response.body) {
      logger.info(response.meta.statusCode);
      logger.info(response.name);
      logger.info(JSON.stringify(response.meta.meta.request, 2, null));
    } else {
      logger.info(response);
    }
    process.exit(-1);
  });
});
