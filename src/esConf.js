import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const API_KEY = process.env.API_KEY || null;

const auth = API_KEY ? { apiKey: API_KEY } : undefined;

/** @type {import("@elastic/elasticsearch").ClientOptions} */
const esClientConfig = {
  auth,
  node: `${ELASTICSEARCH_URL}`,
};

const LOG_INDEX = process.env.LOG_INDEX || "logs";
const REPORT_INDEX = process.env.REPORT_INDEX || "log_reports";
const MONTHLY_REPORT_INDEX =
  process.env.MONTHLY_REPORT_INDEX || "log_reports_monthly";
const WEEKLY_REPORT_INDEX =
  process.env.WEEKLY_REPORT_INDEX || "log_reports_weekly";

const esClient = new Client(esClientConfig);

export {
  ELASTICSEARCH_URL,
  LOG_INDEX,
  REPORT_INDEX,
  MONTHLY_REPORT_INDEX,
  WEEKLY_REPORT_INDEX,
  esClient,
};
