// for a given range, we query all actions from Elastic

// const compose = (...fns) => (arg) => fns.reduceRight((c, f) => f(c), arg);

const BATCH_SIZE = 500;
const SCROLL_TIMEOUT = "30s";

// get last n days from Elastic (starting yesterday)
function getLastDays(n) {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  const createDate = (i) => new Date(now - (i + 1) * dayMillis);
  const formatDate = (date) => date.toISOString().split("T")[0];

  return [...Array(n).keys()].map(createDate).map(formatDate);
}

async function queryLastDays(client, n) {
  const days = getLastDays(n);

  const query = {
    bool: {
      should: [
        days.map((d) => {
          return { match: { logfile: d } };
        }),
      ],
    },
  };

  const initResponse = await client.search({
    index: "logs",
    // should be :
    // index: client.getLogIndex()

    // reading should be done in 2 minutes
    scroll: SCROLL_TIMEOUT,
    body: { query },
    size: BATCH_SIZE,
  });

  const total = initResponse.body.hits.total.value;

  const actions = [];

  const treatResponse = ({ body }) => {
    // get actions from response
    body.hits.hits.forEach((hit) => {
      actions.push(hit._source);
    });

    // return next scroll id
    return body._scroll_id;
  };

  // keep track of the scrolling id
  let scrollId = treatResponse(initResponse);

  // until we've read all actions, we keep scrolling
  while (actions.length < total) {
    // scroll
    const response = await client.scroll({
      scrollId,
      scroll: SCROLL_TIMEOUT,
    });
    if (actions.length % 50000 == 0) {
      console.log(actions.length);
    }
    // read response and get next scroll id
    scrollId = treatResponse(response);
  }

  return actions;
}

export { queryLastDays };
