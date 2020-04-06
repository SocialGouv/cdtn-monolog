import { convertLogs } from "./matomo_converter";
import { logger } from "./logger";
import { Client } from "@elastic/elasticsearch";

async function main() {
  const ELASTICSEARCH_URL = "http://localhost:9200";
  const LOG_INDEX_NAME = "logs";

  const path = "/Users/remim/dev/cdtn/cdtn-monolog/backup-logs/scripts/";

  const date = "2020-03-30";

  // convert matomo logs to actions
  const logPath = `${path}${date}.json`;
  const actions = convertLogs(logPath);

  // push actions as batches to ES
  const esClientConfig = {
    node: `${ELASTICSEARCH_URL}`,
  };
  const client = new Client(esClientConfig);

  // we ensure index exists other we create it
  const { body } = await client.indices.exists({ index: LOG_INDEX_NAME });

  const mappings = {
    properties: {
      actionType: {
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

  function mapAction(action) {
    const header = { index: { _index: LOG_INDEX_NAME, _type: "_doc" } };
    return [header, { actionType: action.type }];
  }

  // bulk insert
  async function insertActions(actions) {
    try {
      await client.bulk({
        index: LOG_INDEX_NAME,
        body: actions.map(mapAction).flat(),
      });
      logger.info(`Index ${actions.length} actions.`);
    } catch (error) {
      logger.error("Index actions", error);
    }
  }

  logger.info(actions[0].type);

  insertActions(actions.slice(0, 10));
}

main().catch((response) => {
  if (response.body) {
    logger(response.meta.statusCode);
    logger(response.name);
    logger(response.meta.meta.request);
  } else {
    logger(response);
  }
  process.exit(-1);
});
