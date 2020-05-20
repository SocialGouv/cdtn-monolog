// shameless copy paste from stack overflow as non critical and
// to avoid adding yet another dependency
const hash = (s) =>
  s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

const mapAction = (
  {
    idVisit,
    feedbackType,
    lastActionDateTime,
    lastActionTimestamp,
    outilEvent,
    outil,
    outilAction,
    suggestionPrefix,
    query,
    referrerName,
    referrerTypeName,
    resultSelection,
    serverTimePretty,
    suggestionSelection,
    timeSpent,
    timestamp,
    type,
    url,
    visited,
  },
  logfile
) => {
  // unique visit id
  const uvi = hash(`${idVisit}-${lastActionDateTime}`);
  const obj = {
    type,
    uvi,
    idVisit,
    feedbackType,
    lastActionDateTime,
    lastActionTimestamp,
    outilEvent,
    outilAction,
    outil,
    suggestionPrefix,
    query,
    referrerName,
    referrerTypeName,
    resultSelection,
    serverTimePretty,
    suggestionSelection,
    timeSpent,
    timestamp,
    url,
    visited,
    logfile,
  };
  return obj;
};

const mappings = {
  properties: {
    logfile: {
      type: "keyword",
    },

    type: {
      type: "keyword",
    },

    // unique visit id
    uvi: {
      type: "keyword",
    },

    idVisit: {
      type: "keyword",
    },

    feedbackType: {
      type: "keyword",
    },

    outilEvent: {
      type: "keyword",
    },

    outilAction: {
      type: "keyword",
    },

    outil: {
      type: "keyword",
    },

    lastActionDateTime: {
      type: "keyword",
    },

    lastActionTimestamp: {
      type: "date",
    },

    query: {
      type: "keyword",
    },

    referrerName: {
      type: "keyword",
    },

    referrerTypeName: {
      type: "keyword",
    },

    resultSelection: {
      type: "object",
    },

    suggestionSelection: {
      type: "keyword",
    },

    suggestionPrefix: {
      type: "keyword",
    },

    // todo we might be able to use date type ?
    serverTimePretty: {
      type: "keyword",
    },

    timeSpent: {
      type: "long",
    },

    timestamp: {
      type: "date",
    },

    url: {
      type: "keyword",
    },

    visited: {
      type: "keyword",
    },

    cc: {
      type: "keyword",
    },

    ccAction: {
      type: "keyword",
    },
  },
};

export { mapAction, mappings };
