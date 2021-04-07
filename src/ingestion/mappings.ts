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

    nActions: {
      type: "short",
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

export { mappings };
