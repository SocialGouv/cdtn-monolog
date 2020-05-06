import * as Covisit from "../analysis/covisit";
import * as Popularity from "../analysis/popularity";
import * as Suggestion from "../analysis/suggestion";

export const defaultAnalysis = async (data) => {
  // then we run the different analysis and store reports
  const covisits = Covisit.analyse(data);
  const popularity = Popularity.analyse(data, 0.2);
  const suggestions = Suggestion.analyse(data);

  const reports = [...covisits, ...popularity, ...suggestions];

  return reports;
};
