import * as Covisit from "../analysis/covisit";
import * as Popularity from "../analysis/popularity";
import * as Suggestion from "../analysis/suggestion";
import * as Metrics from "../analysis/metrics"

export const defaultAnalysis = (
  data,
  popularityReportId = new Date().getTime()
) => {
  // then we run the different analysis and store reports
  //const covisits = Covisit.analyse(data);
  //const popularity = Popularity.analyse(data, 0.2, popularityReportId);
  //const suggestions = Suggestion.analyse(data);
  
  const covisits = {};
  const popularity = {};
  const suggestions = {};
  const metrics = Metrics.analyse(data, popularityReportId);
  const reports = [...metrics]
  //const reports = [...covisits, ...popularity, ...suggestions, ...metrics];

  return reports;
};
