// save and read reports in ES uselss for now as only redirecting to ES
import * as es from "./elastic";
import { logger } from "./logger";

export const standardMappings = {
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

export const queryReportMappings = {
  properties: {
    dcg: {
      type: "long",
    },
    idcg: {
      type: "long",
    },
    ndcg: {
      type: "long",
    },
    problems: {
      properties: {
        count: {
          type: "long",
        },
        ndcg: {
          type: "long",
        },
        query: {
          fields: {
            keyword: {
              ignore_above: 256,
              type: "keyword",
            },
          },
          type: "text",
        },
      },
    },
    queries: {
      properties: {
        count: {
          type: "long",
        },
        query: {
          fields: {
            keyword: {
              ignore_above: 256,
              type: "keyword",
            },
          },
          type: "text",
        },
      },
    },
    queriesCount: {
      type: "long",
    },
    queryKey: {
      type: "long",
    },
    reportId: {
      type: "long",
    },
    reportType: {
      fields: {
        keyword: {
          ignore_above: 256,
          type: "keyword",
        },
      },
      type: "text",
    },
    results: {
      properties: {
        algo: {
          fields: {
            keyword: {
              ignore_above: 256,
              type: "keyword",
            },
          },
          type: "text",
        },
        count: {
          type: "long",
        },
        result: {
          fields: {
            keyword: {
              ignore_above: 256,
              type: "keyword",
            },
          },
          type: "text",
        },
      },
    },
    selectionsCount: {
      type: "long",
    },
    type: {
      fields: {
        keyword: {
          ignore_above: 256,
          type: "keyword",
        },
      },
      type: "text",
    },
  },
};

export const visitReportMappings = {
  properties: {
    averageDailyVisits: {
      type: "integer",
    },

    endDate: {
      type: "date",
    },

    maxDailyVisits: {
      type: "integer",
    },

    nbVisits: {
      type: "integer",
    },

    reportId: {
      type: "keyword",
    },

    startDate: {
      type: "date",
    },
  },
};

export const resetReportIndex = async (esClient, indexName, mappings) => {
  await es
    .deleteIfExists(esClient, indexName)
    .then(() => es.testAndCreateIndex(esClient, indexName, mappings))
    .catch((err) => logger.error(err));
};

export const saveReport = async (esClient, indexName, docs) => {
  await es.batchInsert(esClient, indexName, docs);
  return 0;
};

export const loadReport = async (esClient, indexName, query) => {
  return await es.getDocuments(esClient, indexName, query);
};
