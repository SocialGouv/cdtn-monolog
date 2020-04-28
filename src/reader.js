// read data from file system or ES and create Dataframe

import * as dataForge from "data-forge";
import "data-forge-fs";
import { logger } from "./logger";

const BATCH_SIZE = 500;
const SCROLL_TIMEOUT = "30s";

// get last n days before ref
const getLastDays = (n, ref) => {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;

  const createDate = (i) => new Date(ref.getTime() - (i + 1) * dayMillis);
  const formatDate = (date) => date.toISOString().split("T")[0];

  return [...Array(n).keys()].map(createDate).map(formatDate);
};

export const readFromElastic = async (client, n, ref = new Date()) => {
  const days = getLastDays(n, ref);

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
  logger.info(`Reading ${total} actions : `);

  // until we've read all actions, we keep scrolling
  while (actions.length < total) {
    // scroll
    const response = await client.scroll({
      scrollId,
      scroll: SCROLL_TIMEOUT,
    });
    if (actions.length % 50000 == 0) {
      logger.info(actions.length);
    }
    // read response and get next scroll id
    scrollId = treatResponse(response);
  }

  // return a Dataframe containing actions
  return new dataForge.DataFrame(actions);
};

export const readFromFile = async (path) => dataForge.readFile(path).parseCSV();
