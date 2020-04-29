import { Client } from "@elastic/elasticsearch";

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

export { LOG_INDEX_NAME, REPORT_INDEX_PREFIX, esClient };
