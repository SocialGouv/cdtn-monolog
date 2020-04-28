// save and read reports in ES
import * as es from "./elastic";

export const saveReport = async (docs, mappings, indexName) => {
  //   await es.deleteIfExists(indexName);
  //   await es.testAndCreateIndex(indexName, mappings);
  // await es.batchInsert(indexName, docs);
  return 0;
};

export const loadReport = async (indexName, mapper) => {
  return {};
};
