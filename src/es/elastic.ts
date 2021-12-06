import { Client, ClientOptions } from "@elastic/elasticsearch";
import { logger } from "@socialgouv/cdtn-logger";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;
const LOG_INDEX = process.env.LOG_INDEX || "logs-new";
const REPORT_INDEX = process.env.REPORT_INDEX || "log_reports";
const MONTHLY_REPORT_INDEX =
  process.env.MONTHLY_REPORT_INDEX || "log_reports_monthly";
const QUERY_REPORT_INDEX =
  process.env.QUERY_REPORT_INDEX || "log_reports_queries";
const RESULTS_REPORT_INDEX =
  process.env.RESULTS_REPORT_INDEX || "log_reports_queries_results";

const BATCH_SIZE = 500;

const auth = API_KEY ? { apiKey: API_KEY } : undefined;

const esClientConfig: ClientOptions = {
  auth,
  node: `${ELASTICSEARCH_URL}`,
};

const esClient = new Client(esClientConfig);

export type DocumentResponse = {
  aggregations: any;
  docs: any[];
};

export const getDocumentsFromES = async (
  esClient: Client,
  index: string,
  query: any,
  // TODO use fp-ts option here
  aggs: any = undefined,
  withDocs = true
): Promise<DocumentResponse> => {
  const initResponse = await esClient.search({
    body: { aggs, query },
    index,
    size: BATCH_SIZE,
  });

  const total = initResponse.body.hits.total.value;

  const { aggregations } = initResponse.body;

  const docs: any[] = [];

  if (withDocs) {
    const treatResponse = ({ hits }: { hits: any }) => {
      hits.forEach((hit: any) => {
        docs.push(hit._source);
      });
      if (docs.length % 50000 == 0) {
        logger.debug(docs.length);
      }

      return hits[hits.length - 1].sort[0];
    };

    const pointInTimeId = (
      await esClient.openPointInTime({ index, keep_alive: "1m" })
    ).body.id;

    let searchAfter;

    while (docs.length < total) {
      const response = await esClient.search({
        body: {
          pit: {
            id: pointInTimeId,
            keep_alive: "1m",
          },
          query,
          size: BATCH_SIZE,
          sort: [{ _shard_doc: "asc" }],
          track_total_hits: false, // This will make query faster
          ...(searchAfter && { search_after: [searchAfter] }),
        },
      });
      if (docs.length % 50000 == 0) {
        logger.debug(docs.length);
      }
      if (!response?.body?.hits?.hits || !response.body.hits.hits.length) break;
      searchAfter = treatResponse({ hits: response.body.hits.hits });
    }
  }
  return { aggregations, docs };
};

const getDocuments = async (
  index: string,
  query: any,
  // TODO use fp-ts option here
  aggs: any = undefined,
  withDocs = true
): Promise<DocumentResponse> =>
  getDocumentsFromES(esClient, index, query, aggs, withDocs);

// we ensure index exists otherwise we create it
const testAndCreateIndex = async (index: string, mappings: any) => {
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

const deleteIfExists = async (index: string) => {
  const { body } = await esClient.indices.exists({ index });
  if (body) {
    await esClient.indices.delete({ index });
    logger.info(`Index ${index} deleted.`);
  }
};

const insertDocuments = async (index: string, documents: any) => {
  try {
    const header = { index: { _index: index, _type: "_doc" } };
    const body = documents.flatMap((doc: any) => {
      return [header, doc];
    });
    const resp = await esClient.bulk({
      body,
      index,
    });
    console.log(resp);
    if (resp.body.errors) {
      resp.body.items.forEach((element: any) => {
        if (element.index.status == 400) {
          logger.error(
            `Error during insertion : ${element.index.error.reason}`
          );
        }
      });
    }
  } catch (error) {
    logger.error(`Indexation error : ${error.name}`);
  }
};

const batchInsert = async (index: string, documents: any, size = 1000) => {
  // number of batches
  const n = Math.ceil(documents.length / size);
  logger.info(`${n} batches to insert`);

  for (const i of [...Array(n).keys()]) {
    const batch = documents.slice(i * size, (i + 1) * size);

    await insertDocuments(index, batch);
    if (i === 0) {
      console.log(batch[0]);
    }
  }
  logger.debug(`${documents.length} documents indexed into ${index}.`);
};

export {
  batchInsert,
  deleteIfExists,
  esClient,
  getDocuments,
  LOG_INDEX,
  MONTHLY_REPORT_INDEX,
  QUERY_REPORT_INDEX,
  REPORT_INDEX,
  RESULTS_REPORT_INDEX,
  testAndCreateIndex,
};
