import * as Covisit from "./analysis/covisit";
import * as Suggestion from "./analysis/suggestion";
import * as es from "./elastic";

const Queries = (esClient, index) => {
  return {
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

    getSuggestions: async () => {
      const suggestionsQuery = {
        term: { reportType: Suggestion.reportType },
      };
      return es.getDocuments(esClient, index, suggestionsQuery);
    },
  };
};

export { Queries };
