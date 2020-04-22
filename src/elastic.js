import { Client } from "@elastic/elasticsearch";
import { logger } from "./logger";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;

const auth = API_KEY ? { apiKey: API_KEY } : null;
const esClientConfig = {
  node: `${ELASTICSEARCH_URL}`,
  auth,
};

const LOG_INDEX_NAME = "logs";
const REPORT_INDEX_PREFIX = "logs_report_";

const esClient = new Client(esClientConfig);

// we ensure index exists other we create it
export const testAndCreateIndex = async (index, mappings) => {
  const { body } = await esClient.indices.exists({ index });

  if (!body) {
    try {
      await esClient.indices.create({
        index,
        body: {
          settings: {},
          mappings: mappings,
        },
      });
      logger.info(`Index ${index} created.`);
    } catch (error) {
      logger.error("Index creation : \n", error);
    }
  } else {
    logger.info(`Index ${index} found.`);
    try {
      await esClient.indices.putMapping({
        index,
        body: mappings,
      });
      logger.info(`Mapping updated for ${index}.`);
    } catch (error) {
      logger.error("Index mapping update", error);
    }
  }
};

export const deleteIfExists = async (index) => {
  const { body } = await esClient.indices.exists({ index });
  if (body) {
    await esClient.indices.delete({ index });
  }
};

// bulk insert
async function insertDocuments(index, documents) {
  try {
    const header = { index: { _index: index, _type: "_doc" } };
    const body = documents.flatMap((doc) => {
      return [header, doc];
    });
    const resp = await esClient.bulk({
      index,
      body,
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
    logger.error("Indexing error :\n", error);
  }
}

async function batchInsert(index, documents, size = 1000) {
  // number of batches
  const n = Math.ceil(documents.length / size);
  for (const i of [...Array(n).keys()]) {
    const batch = documents.slice(i * size, (i + 1) * size);
    await insertDocuments(index, batch);
  }
  logger.info(`${documents.length} documents indexed into ${index}.`);
}

export { esClient, batchInsert, LOG_INDEX_NAME, REPORT_INDEX_PREFIX };
