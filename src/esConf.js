import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;


const auth = API_KEY ? { apiKey: API_KEY } : null;
const esClientConfig = {
  node: `${ELASTICSEARCH_URL}`,
  auth,
};

const LOG_INDEX = process.env.LOG_INDEX || "logs";
const REPORT_INDEX = process.env.REPORT_INDEX || "log_reports";

const esClient = new Client(esClientConfig);

export { ELASTICSEARCH_URL, LOG_INDEX, REPORT_INDEX, esClient };
