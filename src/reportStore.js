// save and read reports in ES uselss for now as only redirecting to ES
import * as es from "./elastic";

export const saveReport = async (indexName, docs) => {
  await es.batchInsert(indexName, docs);
  return 0;
};

export const loadReport = async (indexName, query) => {
  return await es.getDocuments(indexName, query);
};
