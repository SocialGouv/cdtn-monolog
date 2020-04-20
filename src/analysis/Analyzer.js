import * as dataForge from "data-forge";

export default class Analyzer {
  constructor(dataset) {
    this.dataset = dataset;
  }

  viewCount() {
    const visits = this.dataset.getVisits();
    const uniqueViews = visits.map((v) => v.getUniqueViews());
    const series = dataForge.Series.concat(uniqueViews);

    // group by value
    const counts = series
      .groupBy((value) => value)
      .select((group) => {
        return {
          url: group.first(),
          count: group.count(),
        };
      })
      .inflate();

    return counts;
  }
}
