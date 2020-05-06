import * as es from "./elastic";
import * as Suggestion from "./analysis/suggestion";
import * as Covisit from "./analysis/covisit";

function Queries(esClient, index) {
  this.esClient = esClient;
  this.index = index;
}

Queries.prototype.getSuggestions = async function () {
  const suggestionsQuery = {
    term: { reportType: Suggestion.reportType },
  };
  return es.getDocuments(this.esClient, this.index, suggestionsQuery);
};

Queries.prototype.getCovisitLinks = async function (content) {
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

  const res = await es.getDocuments(this.esClient, this.index, covisitQuery);
  if (res.length == 1) {
    return res[0];
  } else {
    throw new Error(`Covisit query failed for content : ${content}`);
  }
};

export { Queries };

/*
export const getSuggestions = async (esClient, index) => {
  const suggestionsQuery = {
    term: { reportType: Suggestion.reportType },
  };
  return await es.getDocuments(esClient, index, suggestionsQuery);
};

export const getCovisitLinks = async (esClient, index, content) => {
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

  return await es.getDocuments(esClient, index, covisitQuery);
};

*/
