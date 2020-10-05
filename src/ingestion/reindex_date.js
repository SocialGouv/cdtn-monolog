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
  });
};

export { reIndex };
