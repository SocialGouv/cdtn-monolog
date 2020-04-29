import { esClient } from "./esConf";
import { logger } from "./logger";

// we ensure index exists otherwise we create it
const testAndCreateIndex = async (index, mappings) => {
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
      logger.debug(`Index ${index} created.`);
    } catch (error) {
      logger.error("Index creation : \n", error);
    }
  } else {
    logger.debug(`Index ${index} found.`);
    try {
      await esClient.indices.putMapping({
        index,
        body: mappings,
      });
      logger.debug(`Mapping updated for ${index}.`);
    } catch (error) {
      logger.error("Index mapping update", error);
    }
  }
};

const deleteIfExists = async (index) => {
  const { body } = await esClient.indices.exists({ index });
  if (body) {
    await esClient.indices.delete({ index });
    logger.info(`Index ${index} deleted.`);
  }
};

// bulk insert
const insertDocuments = async (index, documents) => {
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
};

const batchInsert = async (index, documents, size = 1000) => {
  // number of batches
  const n = Math.ceil(documents.length / size);
  logger.info(`${n} batches to insert`);

  for (const i of [...Array(n).keys()]) {
    const batch = documents.slice(i * size, (i + 1) * size);
    await insertDocuments(index, batch);
  }
  logger.debug(`${documents.length} documents indexed into ${index}.`);
};

const SCROLL_TIMEOUT = "30s";
const BATCH_SIZE = 500;

const getDocuments = async (index, query) => {
  const initResponse = await esClient.search({
    index,
    scroll: SCROLL_TIMEOUT,
    body: { query },
    size: BATCH_SIZE,
  });

  const total = initResponse.body.hits.total.value;

  const docs = [];

  const treatResponse = ({ body }) => {
    // get docs from response
    body.hits.hits.forEach((hit) => {
      docs.push(hit._source);
    });

    // return next scroll id
    return body._scroll_id;
  };

  // keep track of the scrolling id
  let scrollId = treatResponse(initResponse);
  logger.debug(`Reading ${total} docs : `);

  // until we've read all docs, we keep scrolling
  while (docs.length < total) {
    // scroll
    const response = await esClient.scroll({
      scrollId,
      scroll: SCROLL_TIMEOUT,
    });
    if (docs.length % 50000 == 0) {
      logger.debug(docs.length);
    }
    // read response and get next scroll id
    scrollId = treatResponse(response);
  }

  return docs;
};

export { batchInsert, getDocuments, testAndCreateIndex, deleteIfExists };
