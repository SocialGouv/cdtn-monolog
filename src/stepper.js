import * as logstashClient from "./logstash/logstashClient";

export const writeSearches = () => {
  logstashClient.getRequests().then(res => console.log(res));
};
