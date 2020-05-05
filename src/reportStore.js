// save and read reports in ES uselss for now as only redirecting to ES
import * as es from "./elastic";

export const saveReport = async (esClient, indexName, docs) => {
  await es.batchInsert(esClient, indexName, docs);
  return 0;
};

export const loadReport = async (esClient, indexName, query) => {
  return await es.getDocuments(esClient, indexName, query);
};
