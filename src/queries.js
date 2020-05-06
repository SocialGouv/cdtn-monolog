import * as es from "./elastic";
import * as Suggestion from "./analysis/suggestion";
import * as Covisit from "./analysis/covisit";

const Queries = (esClient, index) => {
  return {
    getSuggestions: async () => {
      const suggestionsQuery = {
        term: { reportType: Suggestion.reportType },
      };
      return es.getDocuments(esClient, index, suggestionsQuery);
    },

    getCovisitLinks: async (content) => {
      const covisitQuery = {
        bool: {
          must: [
            {
              term: {
                reportType: Covisit.reportType,
              },
            },
            {
              term: {
                content,
              },
            },
          ],
        },
      };

      //   console.log(JSON.stringify(covisitQuery, null, 2));

      const res = await es.getDocuments(esClient, index, covisitQuery);
      if (res.length == 1) {
        return res[0];
      } else {
        throw new Error(`Covisit query failed for content : ${content}`);
      }
    },
  };
};

export { Queries };
