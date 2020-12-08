// save and read reports in ES uselss for now as only redirecting to ES
import { Report } from "../analysis/reports.types";
import * as es from "../es/elastic";
import { DocumentResponse } from "../es/elastic";
import { logger } from "../logger";

export const standardMappings = {
  properties: {
    // covisit
    content: {
      type: "keyword",
    },

    count: {
      type: "integer",
    },

    links: {
      type: "object",
    },

    m0_start: {
      type: "date",
    },
    m1_start: {
      type: "date",
    },
    m2_start: {
      type: "date",
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
      type: "float",
    },
    idcg: {
      type: "float",
    },
    ndcg: {
      type: "float",
    },

    problems: {
      properties: {
        count: {
          type: "integer",
        },
        ndcg: {
          type: "float",
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
        selectionCount: {
          type: "integer",
        },
        selectionRatio: {
          type: "float",
        },
      },
    },

    queries: {
      properties: {
        count: {
          type: "integer",
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
      type: "integer",
    },
    queryKey: {
      type: "integer",
    },
    reportId: {
      fields: {
        keyword: {
          ignore_above: 256,
          type: "keyword",
        },
      },
      type: "string",
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
          type: "integer",
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
    selectionCount: {
      type: "integer",
    },
    selectionRatio: {
      type: "float",
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

export const resetReportIndex = async (
  indexName: string,
  mappings: any
): Promise<void> => {
  await es
    .deleteIfExists(indexName)
    .then(() => es.testAndCreateIndex(indexName, mappings))
    .catch((err: any) => logger.error(err));
};

export const saveReport = async (
  indexName: string,
  docs: Report[]
): Promise<number> => {
  await es.batchInsert(indexName, docs);
  return 0;
};

export const loadReport = async (
  indexName: string,
  query: any
): Promise<DocumentResponse> => es.getDocuments(indexName, query);
