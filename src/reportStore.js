// save and read reports in ES uselss for now as only redirecting to ES
import * as es from "./elastic";

const mappings = {
  properties: {
    // covisit
    content: {
      type: "keyword",
    },

    count: {
      type: "integer",
    },

    end: {
      type: "date",
    },

    links: {
      type: "object",
    },

    pivot: {
      type: "date",
    },

    // default
    reportType: {
      type: "keyword",
    },

    results: {
      type: "object",
    },

    // popularity
    start: {
      type: "date",
    },

    // suggestions
    suggestion: {
      type: "keyword",
    },

    weight: {
      type: "integer",
    },
  },
};

export const resetReportIndex = async (esClient, indexName) => {
  await es
    .deleteIfExists(esClient, indexName)
    .then(() => es.testAndCreateIndex(esClient, indexName, mappings));
};

export const saveReport = async (esClient, indexName, docs) => {
  await es.batchInsert(esClient, indexName, docs);
  return 0;
};

export const loadReport = async (esClient, indexName, query) => {
  return await es.getDocuments(esClient, indexName, query);
};
