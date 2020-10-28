import { logger } from "./logger";

// we ensure index exists otherwise we create it
/**
 *
 * @param {import("@elastic/elasticsearch").Client} esClient
 * @param {string} index
 * @param {*} mappings
 */
const testAndCreateIndex = async (esClient, index, mappings) => {
  const { body } = await esClient.indices.exists({ index });

  if (!body) {
    try {
      await esClient.indices.create({
        body: {
          mappings: mappings,
          settings: {},
        },
        index,
      });
      logger.debug(`Index ${index} created.`);
    } catch (error) {
      logger.error("Index creation : \n", error);
    }
  } else {
    logger.debug(`Index ${index} found.`);
    try {
      await esClient.indices.putMapping({
        body: mappings,
        index,
      });
      logger.debug(`Mapping updated for ${index}.`);
    } catch (error) {
      logger.error("Index mapping update", error);
    }
  }
};

/**
 *
 * @param {import("@elastic/elasticsearch").Client} esClient
 * @param {string} index
 */
const deleteIfExists = async (esClient, index) => {
  const { body } = await esClient.indices.exists({ index });
  if (body) {
    await esClient.indices.delete({ index });
    logger.info(`Index ${index} deleted.`);
  }
};

/**
 *
 * @param {import("@elastic/elasticsearch").Client} esClient
 * @param {string} index
 * @param {*} documents
 */
const insertDocuments = async (esClient, index, documents) => {
  try {
    const header = { index: { _index: index, _type: "_doc" } };
    const body = documents.flatMap((doc) => {
      return [header, doc];
    });
    const resp = await esClient.bulk({
      body,
      index,
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
};

/**
 * @param {import("@elastic/elasticsearch").Client} esClient
 * @param {string} index
 * @param {*} documents
 * @param {number} size
 */
const batchInsert = async (esClient, index, documents, size = 1000) => {
  // number of batches
  const n = Math.ceil(documents.length / size);
  logger.info(`${n} batches to insert`);

  for (const i of [...Array(n).keys()]) {
    const batch = documents.slice(i * size, (i + 1) * size);
    await insertDocuments(esClient, index, batch);
  }
  logger.debug(`${documents.length} documents indexed into ${index}.`);
};

const SCROLL_TIMEOUT = "30s";
const BATCH_SIZE = 500;

/**
 * @param {import("@elastic/elasticsearch").Client} esClient
 * @param {string} index
 * @param {*} query
 * @param {*} aggs
 * @param {boolean} withDocs
 */
const getDocuments = async (
  esClient,
  index,
  query,
  aggs = undefined,
  withDocs = true
) => {
  const initResponse = await esClient.search({
    body: { aggs, query },
    index,
    scroll: SCROLL_TIMEOUT,
    size: BATCH_SIZE,
  });

  const total = initResponse.body.hits.total.value;

  const { aggregations } = initResponse.body;

  /** @type {Array.<*>} */
  const docs = [];

  if (withDocs) {
    const treatResponse = ({ body }) => {
      // get docs from response
      body.hits.hits.forEach((hit) => {
        docs.push(hit._source);
      });

      // return next scroll id
      return body._scroll_id;
    };

    // keep track of the scrolling id
    /** @type {number} */
    let scrollId = treatResponse(initResponse);
    logger.debug(`Reading ${total} docs : `);

    // until we've read all docs, we keep scrolling
    while (docs.length < total) {
      // scroll
      // @ts-ignore
      const response = await esClient.scroll({
        scroll: SCROLL_TIMEOUT,
        scrollId,
      });
      if (docs.length % 50000 == 0) {
        logger.debug(docs.length);
      }
      // read response and get next scroll id
      scrollId = treatResponse(response);
    }
  }

  return { aggregations, docs };
};

export { batchInsert, getDocuments, testAndCreateIndex, deleteIfExists };
