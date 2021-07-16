import { Client } from "@elastic/elasticsearch";

import * as Covisit from "./analysis/covisit";
import { getDocumentsFromES } from "./es/elastic";

const LogQueries = (esClient: Client, index: string) => {
  return {
    getCovisitLinks: async (content: string) => {
      const covisitQuery = {
        bool: {
          must: [
            {
              term: {
                "reportType.keyword": Covisit.reportType,
              },
            },
            {
              term: {
                "content.keyword": content,
              },
            },
          ],
        },
      };

      //   console.log(JSON.stringify(covisitQuery, null, 2));

      const res = await getDocumentsFromES(esClient, index, covisitQuery);
      if (res.docs.length == 1) {
        return res.docs[0];
      } else {
        throw new Error(`Covisit query failed for content : ${content}`);
      }
    },
  };
};

export { LogQueries };
