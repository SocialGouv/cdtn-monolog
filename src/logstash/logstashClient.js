import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9201";

const client = new Client({
  node: `${ELASTICSEARCH_URL}`
});

// get all the individual search requests
export const getRequests = () => {
  return client
    .search({
      index: "logstash",
      body: {
        size: 1000,
        query: {
          match: {
            type: "search"
          }
        }
      }
    })
    .then(res => {
      // console.log(res);
      return res.body.hits.hits.map(q => q._source.query);
    })
    .catch(err => console.log(err));
};

export const getVisitSteps = idVisit => {
  return client
    .search({
      index: "logstash",
      body: {
        size: 1000,
        query: {
          match: {
            idVisit: idVisit
          }
        }
      }
    })
    .then(res => res.body.hits.hits);
};
