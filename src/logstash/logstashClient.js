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
    .then(res => res.body.hits.hits.map(q => q._source))
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

export const getRandomVisitIds = n => {
  // we return 100 times the result in order to shuffle and slide, as they are ordered by count
  return client
    .search({
      index: "logstash",
      body: {
        aggs: {
          group_by_state: {
            terms: {
              field: "idVisit",
              size: n * 100
            }
          }
        },
        size: 0,
        query: {
          match_all: {}
        }
      }
    })
    .then(res => {
      const allVisits = res.body.aggregations.group_by_state.buckets;
      const rand = Array.from({ length: n }, () =>
        Math.floor(Math.random() * allVisits.length)
      );
      return rand.map(r => allVisits[r].key);
    });
};
