import * as es from "./elastic";
import * as Suggestion from "./analysis/suggestion";

export const getSuggestions = async (esClient, index) => {
  const suggestionsQuery = {
    term: { reportType: Suggestion.reportType },
  };
  return await es.getDocuments(esClient, index, suggestionsQuery);
  //   return [];
};
