import * as dataForge from "data-forge";

import * as Metrics from "../metrics";

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

describe("Cleaning pipe", () => {
  it("shodl clean the user logs correctly", () => {
    const dirtyVisits1 = new dataForge.DataFrame([
      {
        type: "visit_content",
        referrerTypeName: "Search Engines",
        url: "https://whatever.com/content#anchor?q=somequery",
      },
      {
        type: "visit_content",
        referrerTypeName: "Search Engines",
        url: "https://whatever.com/duplicate?q=somequery",
      },
      {
        type: "visit_content",
        referrerTypeName: "Search Engines",
        url: "https://whatever.com/notduplicate?q=somequery",
      },
      {
        type: "outils",
        referrerTypeName: "Search Engines",
        url: "https://whatever.com/duplicate#anothersection?q=anotherquery",
      },
    ]);
    const dirtyVisits2 = new dataForge.DataFrame([
      {
        type: "visit_content",
        referrerTypeName: "Search Engines",
        url: "another-user.com/content",
      },
    ]);
    const dirtyVisits = new dataForge.Series([dirtyVisits1, dirtyVisits2]);
    const cleanedSeries = Metrics.clean(dirtyVisits);
    //console.log(cleanedSeries);
    expect(cleanedSeries).toMatchSnapshot();
  });
});

describe("Basic arithmetic", () => {
  it("should sum bolean elements of array", () => {
    const arr = Array(true, false, true);
    const sum = arr.reduce(Metrics.add);
    expect(sum).toBe(2);
  });
  it("should sum average elements of array", () => {
    const arr = Array(true, false, true);
    const average = Metrics.avg(arr);
    expect(average).toBe(2 / 3);
  });
  it("should count nb of elements of each value  in array", () => {
    const arr = Array(true, false, true, "whatever");
    const values = Metrics.valueCounts(arr);
    expect(values).toStrictEqual({ false: 1, true: 2, whatever: 1 });
  });
});

describe("Business logic", () => {
  it("it should aggregates user sessions", () => {
    const session = new dataForge.DataFrame([
      { referrerTypeName: null, type: "visit_content" },
      { referrerTypeName: null, type: "visit_content" },
      { referrerTypeName: null, type: "visit_content" },
    ]);
    const sessionsCounts = Metrics.typeCounts(session);
    expect(sessionsCounts.toArray()).toStrictEqual([
      { count: 3, referrerTypeName: null, type: "visit_content" },
    ]);
  });
  it("it should aggregates user having different content types", () => {
    const session = new dataForge.DataFrame([
      { referrerTypeName: null, type: "visit_content" },
      { referrerTypeName: null, type: "visit_content" },
      { referrerTypeName: null, type: "selectRelated" },
      { referrerTypeName: null, type: "selectRelated" },
      { referrerTypeName: null, type: "selectRelated" },
    ]);
    const sessionsCounts = Metrics.typeCounts(session);
    expect(sessionsCounts.toArray()).toStrictEqual([
      { count: 2, referrerTypeName: null, type: "visit_content" },
      { count: 3, referrerTypeName: null, type: "selectRelated" },
    ]);
  });
  it("it should detect exploratory visits", () => {
    const sessionCount = {
      count: 5,
      referrerTypeName: null,
      type: "visit_content",
    };
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(true);
  });
  it("it should detect exploratory visits search", () => {
    const sessionCount = { count: 1, referrerTypeName: null, type: "search" };
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(true);
  });
  it("it should detect exploratory visits themes", () => {
    const sessionCount = { count: 1, referrerTypeName: null, type: "themes" };
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(true);
  });
  it("it should detect exploratory visits selectResult", () => {
    const sessionCount = {
      count: 1,
      referrerTypeName: null,
      type: "selectRelated",
    };
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(true);
  });
  it("it should detect empty visits as short", () => {
    const sessionCount = {};
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(false);
  });
  it("it should not detect visits with noise", () => {
    const sessionCount = {
      count: 100,
      referrerTypeName: null,
      type: "whatever",
    };
    const isExplo = Metrics.isExploVisit(sessionCount);
    expect(isExplo).toBe(false);
  });
  it("it should detect redirected user", () => {
    const sessionCount = {
      count: 1,
      referrerTypeName: "Search Engines",
      type: "selectRelated",
    };
    const isRedirect = Metrics.isRedirected(sessionCount);
    expect(isRedirect).toBe(true);
  });
  it("it shouldnot has selected related", () => {
    const sessionCount = {
      count: 1,
      referrerTypeName: "Direct Entry",
      type: "selectRelated",
    };
    const isRedirect = Metrics.hasSelectedRelated(sessionCount);
    expect(isRedirect).toBe(true);
  });
  it("it should count selectRelated", () => {
    const sessionCount = {
      count: 8,
      referrerTypeName: "Direct Entry",
      type: "selectRelated",
    };
    const countrelated = Metrics.countSelectRelated(sessionCount);
    expect(countrelated).toBe(8);
  });
  it("it should get stats of selectRelated", () => {
    const sessionCountArray = [
      { count: 8, referrerTypeName: "Search Engines", type: "selectRelated" },
      { count: 3, referrerTypeName: "whatsoever", type: "visit_content" },
      { count: 1, referrerTypeName: "whatsoever", type: "whoever" },
    ];
    const countrelated = Metrics.getSelectRelated(sessionCountArray);

    expect(countrelated).toStrictEqual({
      selectRelatedCount: 8,
      visitorSelectedRelated: true,
      visitorWasRedirected: true,
    });
  });
  it("it should get user session Type", () => {
    const sessionCountArray = [
      { count: 8, referrerTypeName: "Search Engines", type: "selectRelated" },
      { count: 3, referrerTypeName: "whatsoever", type: "visit_content" },
      { count: 1, referrerTypeName: "whatsoever", type: "whoever" },
    ];
    const countrelated = Metrics.getUserType(sessionCountArray);
    expect(countrelated).toBe(true);
    console.log(countrelated);
  });
  it("it should get user session Type 2", () => {
    const sessionCountArray = [
      { count: 2, referrerTypeName: "whatsoever", type: "visit_content" },
      { count: 1, referrerTypeName: "whatsoever", type: "whoever" },
    ];
    const countrelated = Metrics.getUserType(sessionCountArray);
    expect(countrelated).toBe(false);
  });
});
