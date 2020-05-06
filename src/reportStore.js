// save and read reports in ES uselss for now as only redirecting to ES
import * as es from "./elastic";

const mappings = {
  properties: {
    // default
    reportType: {
      type: "keyword",
    },

    // covisit
    content: {
      type: "keyword",
    },
    links: {
      type: "object",
    },

    // suggestions
    suggestion: {
      type: "keyword",
    },
    weight: {
      type: "integer",
    },
    count: {
      type: "integer",
    },

    // popularity
    start: {
      type: "date",
    },
    end: {
      type: "date",
    },
    pivot: {
      type: "date",
    },
    results: {
      type: "object",
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
