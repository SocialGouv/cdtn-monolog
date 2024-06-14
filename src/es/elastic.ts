import { Client, ClientOptions } from "@elastic/elasticsearch";
import { logger } from "@socialgouv/cdtn-logger";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;
const LOG_INDEX = process.env.LOG_INDEX || "logs-new";
const REPORT_INDEX = process.env.REPORT_INDEX || "log_reports";
const MONTHLY_REPORT_INDEX = process.env.MONTHLY_REPORT_INDEX || "log_reports_monthly";
const SATISFACTION_REASONS_INDEX = process.env.SATISFACTION_REASONS_INDEX || "logs-satisfaction-reasons";
const QUERY_REPORT_INDEX = process.env.QUERY_REPORT_INDEX || "log_reports_queries";
const RESULTS_REPORT_INDEX = process.env.RESULTS_REPORT_INDEX || "log_reports_queries_results";
export const KPI_INDEX = process.env.KPI_INDEX || "log_kpi_index";

const BATCH_SIZE = 1000;

const auth = API_KEY ? { apiKey: API_KEY } : undefined;

const esClientConfig: ClientOptions = {
  auth,
  node: `${ELASTICSEARCH_URL}`,
  requestTimeout: 600000,
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
  const initResponse: any = await esClient.search<any>({
    aggs,
    index,
    query,
    size: BATCH_SIZE,
  });

  const total = initResponse.hits.total.value;
  const aggregations = initResponse.aggregations;

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

    const pointInTimeId = (await esClient.openPointInTime({ index, keep_alive: "10m" })).id;

    let searchAfter;

    while (docs.length < total) {
      const response = await esClient.search({
        body: {
          pit: {
            id: pointInTimeId,
            keep_alive: "10m",
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
      if (!response?.hits?.hits || !response.hits.hits.length) break;
      searchAfter = treatResponse({ hits: response.hits.hits });
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
): Promise<DocumentResponse> => getDocumentsFromES(esClient, index, query, aggs, withDocs);

// we ensure index exists otherwise we create it
const testAndCreateIndex = async (index: string, mappings: any) => {
  const exist = await esClient.indices.exists({ index });

  if (!exist) {
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
  const exist = await esClient.indices.exists({ index });
  if (exist) {
    await esClient.indices.delete({ index });
    logger.info(`Index ${index} deleted.`);
  }
};

const insertDocuments = async (index: string, documents: any) => {
  try {
    const header = { create: { _index: index } };
    const body = documents.flatMap((doc: any) => {
      return [header, doc];
    });
    const resp = await esClient.bulk({ body, refresh: true });
    console.log(`Batch ${resp.items.length} (with errors : ${resp.errors})`);
    if (resp.errors) {
      resp.items.forEach((element: any) => {
        if (element.index.status == 400) {
          logger.error(`Error during insertion : ${element.index.error.reason}`);
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
  REPORT_INDEX,
  RESULTS_REPORT_INDEX,
  SATISFACTION_REASONS_INDEX,
  testAndCreateIndex,
};
