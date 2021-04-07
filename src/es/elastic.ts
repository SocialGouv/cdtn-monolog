import { Client, ClientOptions } from "@elastic/elasticsearch";

import { logger } from "../logger";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;
const LOG_INDEX = process.env.LOG_INDEX || "logs";
const REPORT_INDEX = process.env.REPORT_INDEX || "log_reports";
const MONTHLY_REPORT_INDEX =
  process.env.MONTHLY_REPORT_INDEX || "log_reports_monthly";
const QUERY_REPORT_INDEX =
  process.env.QUERY_REPORT_INDEX || "log_reports_queries";
const RESULTS_REPORT_INDEX =
  process.env.RESULTS_REPORT_INDEX || "log_reports_queries_results";
const QUERY_REPORT_SUMMARY_INDEX =
  process.env.QUERY_REPORT_SUMMARY_INDEX || "log_reports_queries_summary";

const SCROLL_TIMEOUT = "50s";
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
    scroll: SCROLL_TIMEOUT,
    size: BATCH_SIZE,
  });

  const total = initResponse.body.hits.total.value;

  const { aggregations } = initResponse.body;

  const docs: any[] = [];

  if (withDocs) {
    const treatResponse = ({ body }: { body: any }) => {
      // get docs from response
      body.hits.hits.forEach((hit: any) => {
        docs.push(hit._source);
      });

      // return next scroll id
      return body._scroll_id;
    };

    let scroll_id = treatResponse(initResponse);
    logger.debug(`Reading ${total} docs : `);

    // until we've read all docs, we keep scrolling
    while (docs.length < total) {
      // scroll
      const response = await esClient.scroll({
        scroll: SCROLL_TIMEOUT,
        scroll_id,
        // scrollId,
      });
      if (docs.length % 50000 == 0) {
        logger.debug(docs.length);
      }
      // read response and get next scroll id
      scroll_id = treatResponse(response);
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
  QUERY_REPORT_SUMMARY_INDEX,
  REPORT_INDEX,
  RESULTS_REPORT_INDEX,
  testAndCreateIndex,
};
