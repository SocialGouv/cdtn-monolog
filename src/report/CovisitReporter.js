import * as es from "../elastic";
import { urlToPath } from "../utils";

const linkLimit = 6;
const mappings = {
  properties: {
    content: {
      type: "keyword",
    },
    links: {
      type: "object",
    },
  },
};

export class CovisitReporter {
  constructor(client) {
    this.client = client;
    this.indexName = es.REPORT_INDEX_PREFIX + "covisits";
  }

  async printReport(covisitMap) {
    covisitMap.forEach((counts, url) => {
      console.log(`### ${urlToPath(url)}`);

      Array.from(counts)
        .slice(0, 6)
        .forEach(([link, count]) => {
          console.log(`- ${count} : ${urlToPath(link)}`);
        });
    });
  }

  async publishReport(covisitMap) {
    await es.deleteIfExists(this.indexName);
    await es.testAndCreateIndex(this.indexName, mappings);

    const docs = [];
    covisitMap.forEach((counts, url) => {
      const content = urlToPath(url);

      const links = Array.from(counts)
        .slice(0, linkLimit)
        .map(([link, count]) => {
          return {
            link: urlToPath(link),
            count,
          };
        });
      docs.push({ content, links });
    });

    await es.batchInsert(this.indexName, docs);
  }
}
