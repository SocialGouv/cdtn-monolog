import * as elastic from "../elastic";
import * as ingester from "./ingester";

const reIndex = async (esClient, indexSource, indexDest) => {
  await esClient.reindex({
    body: {
      dest: {
        index: indexDest,
      },
      source: {
        index: indexSource,
      },
    },
    refresh: true,
    wait_for_completion: false,
  });
};

export { reIndex };
