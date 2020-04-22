import * as es from "../elastic";

const mappings = {
  properties: {
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

export class PopularityReporter {
  constructor(client) {
    this.client = client;
    this.indexName = es.REPORT_INDEX_PREFIX + "popularity";
  }

  async publishReport(diff) {
    await es.deleteIfExists(this.indexName);
    await es.testAndCreateIndex(this.indexName, mappings);

    const doc = diff;

    await es.batchInsert(this.indexName, [doc]);
  }
}
