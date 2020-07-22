import * as Metrics from "../metrics"
import { internals } from "@elastic/elasticsearch/lib/pool"

// test minimal utils

console.log(Metrics.removeAnchor("eaezae"))
describe("remove Anchor", () => {
  
    it("should remove anchors in url", () => {
        const url = "https://whatever.com/content#section";
        const base_url = "https://whatever.com/";
        const url_no_anchor = Metrics.removeAnchor(url);
        expect(url_no_anchor === base_url);
    });

  });
  