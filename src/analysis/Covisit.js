// analyse function takes a dataset and return documents
// analyser has a mappings

export const mappings = {
  properties: {
    count: {
      type: "integer",
    },
    /*
    start: {
      type: "date",
    },
    end: {
      type: "date",
    },
    pivot: {
      type: "date",
    },
    results: {
      type: "object",
    },
    */
  },
};

export const analyse = (dataset) => {
  return [{ count: dataset.getVisits().count() }];
};

export const mapReport = (source) => {
  source;
};
