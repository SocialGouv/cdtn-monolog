import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const LOG_INDEX_NAME = "logs";
const API_KEY = process.env.API_KEY || null;

const auth = API_KEY ? { apiKey: API_KEY } : null;
const esClientConfig = {
  node: `${ELASTICSEARCH_URL}`,
  auth,
};

const esClient = new Client(esClientConfig);

export { esClient };
