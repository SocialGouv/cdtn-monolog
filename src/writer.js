import * as logstashClient from "./logstash/logstashClient";
import { promises as fs } from "fs";

export const writeSearches = out => {
  return logstashClient.getRequests().then(res => {
    // we deduplicate searches in visits using stringify (cannot specify equality function for set)
    const dedup = new Set(
      res.map(r => JSON.stringify({ query: r.query, idVisit: r.idVisit }))
    );
    const array = Array.from(dedup).map(JSON.parse);
    fs.writeFile(out, JSON.stringify(array), "utf8");
  });
};

writeSearches("export.json").catch(err => console.log(err));
