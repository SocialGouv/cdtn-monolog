import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";

const index = "logstash";

const client = new Client({
  node: `${ELASTICSEARCH_URL}`
});

// get all the individual search requests
export const getRequests = () => {
  return client
    .search({
      index,
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
      index,
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
      index,
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

/*
// TODO cheap scrolling, we need to iterate as batches
export const xxx = n => {
  return client
    .scroll({
      index,
      scroll: "10s",
      body: {
        query: {
          match_all: {}
        }
      }
    })
    .then(res => res.body.hits.hits.map(h => h._source));
};

export const scrollSteps = async () => {
  const steps = [];

  // first we do a search, and specify a scroll timeout
  const res = await client.search(
    {
      index,
      scroll: "10s",
      body: {
        query: {
          match_all: {}
        }
      }
    },
    function getMoreUntilDone(error, response) {
      // collect all the records
      response.hits.hits.forEach(function(hit) {
        steps.push(hit);
      });

      if (response.hits.total !== steps.length) {
        // now we can call scroll over and over
        client.scroll(
          {
            scrollId: response._scroll_id,
            scroll: "10s"
          },
          getMoreUntilDone
        );
      } else {
        console.log(`Scroll done ${client.length} results.`);
        return steps;
      }
    }
  );
  return res;
};
*/

// borrowed from Elastic documentation
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/scroll_examples.html
// Scroll utility
async function* scrollSearch(params) {
  var response = await client.search(params);

  while (true) {
    const sourceHits = response.body.hits.hits;

    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response.body._scroll_id) {
      break;
    }

    response = await client.scroll({
      scrollId: response.body._scroll_id,
      scroll: params.scroll
    });
  }
}

export const scrollSteps = async () => {
  const params = {
    index,
    scroll: "30s",
    body: {
      query: {
        match_all: {}
      }
    }
  };

  const steps = [];

  for await (const hit of scrollSearch(params)) {
    steps.push(hit._source);
  }
  return steps;
};
