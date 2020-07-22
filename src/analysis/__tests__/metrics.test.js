import * as Metrics from "../metrics"
import { internals } from "@elastic/elasticsearch/lib/pool"
import * as dataForge from "data-forge";

// test minimal utils

describe("Cleaning", () => {
  
    it("should remove anchors in url", () => {
        const url = "https://whatever.com/content#section";
        const base_url = "https://whatever.com/content";
        const url_no_anchor = Metrics.removeAnchor(url);
        expect(url_no_anchor).toBe(base_url);
    });
    it("should remove queries in url", () => {
        const url = "https://whatever.com/content?q=somequery'('é('é@&§§('";
        const base_url = "https://whatever.com/content";
        const url_no_query = Metrics.removeQuery(url);
        expect(url_no_query).toBe(base_url);
    });
    it("should remove both queries and anchors in url", () => {
        const url = "https://whatever.com/content#anchor?q=somequery";
        const base_url = "https://whatever.com/content";
        const url_cleaned = Metrics.removeQuery(Metrics.removeAnchor(url));
        expect(url_cleaned).toBe(base_url);
    });
  });


  describe("Basic arithmetic", () => {
  
    it("should sum bolean elements of array", () => {
        const arr = Array(true, false, true)
        const  sum  = arr.reduce(Metrics.add)
        expect(sum).toBe(2);
    });
    it("should sum average elements of array", () => {
        const arr = Array(true, false, true)
        const  average  = Metrics.avg(arr)
        expect(average).toBe(2/3);
    });
    it("should count nb of elements of each value  in array", () => {
        const arr = Array(true, false, true, "whatever")
        const  values  = Metrics.valueCounts(arr)
        expect(values).toStrictEqual({"true":2, "false":1, "whatever": 1});
    });
  });

  describe("Business logic", () => {
  
    it("it should aggregates user sessions", () => {

        const session = new dataForge.DataFrame([
            {type:"visit_content", referrerTypeName:null},
            {type:"visit_content", referrerTypeName:null},
            {type:"visit_content", referrerTypeName:null}
          ]);
        const  sessionsCounts = Metrics.typeCounts(session)
        expect(sessionsCounts.toArray()).toStrictEqual([{"type":"visit_content", count:3, referrerTypeName:null}]);
    });
    it("it should aggregates user having different content types", () => {

        const session = new dataForge.DataFrame([
            {type:"visit_content", referrerTypeName:null},
            {type:"visit_content", referrerTypeName:null},
            {type:"selectRelated", referrerTypeName:null},
            {type:"selectRelated", referrerTypeName:null},
            {type:"selectRelated", referrerTypeName:null}
          ]);
        const  sessionsCounts = Metrics.typeCounts(session)
        expect(sessionsCounts.toArray()).toStrictEqual([{"type":"visit_content", count:2, referrerTypeName:null},
                                                        {"type":"selectRelated", count:3, referrerTypeName:null}]);
    });
    it("it should detect exploratory visits", () => {

    const sessionCount = {type:"visit_content", count: 5, referrerTypeName:null}
        const  isExplo = Metrics.isExploVisit(sessionCount)
        expect(isExplo).toBe(true)
    });
    it("it should detect exploratory visits search", () => {

        const sessionCount = {type:"search", count: 1, referrerTypeName:null}
            const  isExplo = Metrics.isExploVisit(sessionCount)
            expect(isExplo).toBe(true)
        });
    it("it should detect exploratory visits themes", () => {

            const sessionCount = {type:"themes", count: 1, referrerTypeName:null}
                const  isExplo = Metrics.isExploVisit(sessionCount)
                expect(isExplo).toBe(true)
            });
    it("it should detect exploratory visits selectResult", () => {

            const sessionCount = {type:"selectRelated", count: 1, referrerTypeName:null}
                const  isExplo = Metrics.isExploVisit(sessionCount)
                expect(isExplo).toBe(true)
            });
    it("it should detect empty visits as short", () => {

        const sessionCount = {}
            const  isExplo = Metrics.isExploVisit(sessionCount)
            expect(isExplo).toBe(false)
        });
    it("it should detect noise visits", () => {

        const sessionCount = {type:"whatever", count: 100, referrerTypeName:null}
                const  isExplo = Metrics.isExploVisit(sessionCount)
                expect(isExplo).toBe(false)
            });
  });
  