const visitType = "visit_content";

export class Dataset {
  constructor(dataFrame) {
    this.dataFrame = dataFrame;
  }

  getVisits() {
    const visitsDF = this.dataFrame.groupBy((row) => row.uvi);
    // we should try to note use array here
    return visitsDF.toArray().map((visitDF) => new Visit(visitDF));
  }
}

export class Visit {
  constructor(dataFrame) {
    this.dataFrame = dataFrame;
  }

  getActions(type) {
    return this.dataFrame.where((a) => a.type == type);
  }

  getUniqueViews() {
    // use disctinct
    return this.getActions(visitType)
      .distinct((row) => row.url)
      .deflate((row) => row.url);
  }
}
