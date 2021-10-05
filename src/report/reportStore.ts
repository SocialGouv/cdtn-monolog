// save and read reports in ES uselss for now as only redirecting to ES
import { logger } from "@socialgouv/cdtn-logger";

import { Report } from "../analysis/reports";
import * as es from "../es/elastic";
import { DocumentResponse } from "../es/elastic";

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
    endDate: {
      type: "date",
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
      type: "long",
    },
    queryName: {
      ignore_above: 1024,
      type: "keyword",
    },
    queryVariants: {
      ignore_above: 1024,
      type: "keyword",
    },
    reportId: {
      ignore_above: 256,
      type: "keyword",
    },
    reportType: {
      ignore_above: 256,
      type: "keyword",
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
    startDate: {
      type: "date",
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

export const resultReportMappings = {
  properties: {
    algo: {
      ignore_above: 256,
      type: "keyword",
    },
    count: {
      type: "integer",
    },
    endDate: {
      type: "date",
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
    queryName: {
      ignore_above: 1024,
      type: "keyword",
    },
    queryVariants: {
      ignore_above: 1024,
      type: "keyword",
    },
    reportId: {
      ignore_above: 256,
      type: "keyword",
    },
    reportType: {
      ignore_above: 256,
      type: "keyword",
    },
    result: {
      ignore_above: 256,
      type: "keyword",
    },
    startDate: {
      type: "date",
    },
  },
};

export const visitReportMappings = {
  properties: {
    averageDailyVisits: {
      type: "integer",
    },
    averageDailyVisitsWorkDays: {
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

export const satisfactionMappings = {
  properties: {
    avg_time_spent: {
      type: "float",
    },
    entry_rate: {
      type: "float",
    },
    exit_rate: {
      type: "float",
    },
    feed_nb: {
      type: "integer",
    },
    feed_negative: {
      type: "integer",
    },

    endDate: {
      type: "date",
    },
    feed_positive: {
      type: "integer",
    },
    feedback_difference: {
      type: "integer",
    },
    feedback_ratio: {
      type: "float",
    },
    median_rank: {
      type: "float",
    },
    median_time_spent: {
      type: "float",
    },
    pageType: {
      type: "keyword",
    },
    page_name: {
      type: "keyword",
    },
    page_views: {
      type: "long",
    },
    select_related_out_nb: {
      type: "keyword",
    },
    select_related_ratio: {
      type: "float",
    },
    unique_page_rate: {
      type: "float",
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
