import * as Covisit from "../analysis/covisit";
import * as Metrics from "../analysis/metrics";
import * as MonthlyReport from "../analysis/monthlyReport.js";
import * as Popularity from "../analysis/popularity";
import * as Suggestion from "../analysis/suggestion";

export const defaultAnalysis = (data, reportId = new Date().getTime()) => {
  // then we run the different analysis and store reports

  const covisits = Covisit.analyse(data);
  const popularity = Popularity.analyse(data, 0.2, reportId);
  const suggestions = Suggestion.analyse(data);
  const metrics = Metrics.analyse(data, reportId);
  const monthlyReport = MonthlyReport.analyse(data, reportId);

  const reports = [
    ...covisits,
    ...popularity,
    ...suggestions,
    ...metrics,
    ...monthlyReport,
  ];
  return reports;
};
