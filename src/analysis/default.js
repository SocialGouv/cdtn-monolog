import * as Covisit from "../analysis/covisit";
import * as Popularity from "../analysis/popularity";
import * as Suggestion from "../analysis/suggestion";
import * as Metrics from "../analysis/metrics"

export const defaultAnalysis = (
  data,
  ReportId = new Date().getTime()
) => {
  // then we run the different analysis and store reports
  //const covisits = Covisit.analyse(data);
  //const popularity = Popularity.analyse(data, 0.2, ReportId);
  //const suggestions = Suggestion.analyse(data);
  const metrics = Metrics.analyse(data, ReportId);
  
  //const reports = [...covisits, ...popularity, ...suggestions, ...metrics];
  console.log(metrics)
  //return reports;
};
