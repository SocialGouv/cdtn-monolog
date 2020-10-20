// shameless copy paste from stack overflow as non critical and
// to avoid adding yet another dependency
const hash = (s) =>
  s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

const mapAction = (
  {
    cc,
    ccAction,
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
    recoType,
    recoSelection,
  },
  logfile
) => {
  // unique visit id
  const uvi = hash(`${idVisit}-${lastActionDateTime}`);
  const obj = {
    cc,
    ccAction,
    feedbackType,
    idVisit,
    lastActionDateTime,
    lastActionTimestamp,
    logfile,
    outil,
    outilAction,
    outilEvent,
    query,
    recoSelection,
    recoType,
    referrerName,
    referrerTypeName,
    resultSelection,
    serverTimePretty,
    suggestionPrefix,
    suggestionSelection,
    timeSpent,
    timestamp,
    type,
    url,
    uvi,
    visited,
  };
  return obj;
};

const mappings = {
  properties: {
    cc: {
      type: "keyword",
    },

    ccAction: {
      type: "keyword",
    },

    feedbackType: {
      type: "keyword",
    },

    idVisit: {
      type: "keyword",
    },

    lastActionDateTime: {
      format: "yyyy-MM-dd HH:mm:ss",
      type: "date",
    },

    lastActionTimestamp: {
      format: "epoch_second",
      type: "date",
    },

    logfile: {
      type: "keyword",
    },

    outil: {
      type: "keyword",
    },

    outilAction: {
      type: "keyword",
    },

    outilEvent: {
      type: "keyword",
    },

    query: {
      type: "keyword",
    },

    recoSelection: {
      type: "keyword",
    },

    recoType: {
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

    // todo we might be able to use date type ?
    serverTimePretty: {
      type: "keyword",
    },

    suggestionPrefix: {
      type: "keyword",
    },

    suggestionSelection: {
      type: "keyword",
    },

    timeSpent: {
      type: "long",
    },

    timestamp: {
      format: "epoch_second",
      type: "date",
    },

    type: {
      type: "keyword",
    },

    url: {
      type: "keyword",
    },

    // unique visit id
    uvi: {
      type: "keyword",
    },

    visited: {
      type: "keyword",
    },
  },
};

export { mapAction, mappings };
