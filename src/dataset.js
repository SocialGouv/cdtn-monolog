/*
const AllVisitsDF = (dataframe) => ({
  getVisits() {
    return dataframe.groupBy((row) => row.uvi);
  },
});

export const Dataset = (dataframe) =>
  Object.assign(dataframe, AllVisitsDF(dataframe));
  */

import * as util from "./util";

export const getVisits = (dataframe) => {
  return dataframe.groupBy((row) => row.uvi);
};

// deduplicate views : for each visit, get unique content views grouping by url
export const toUniqueViews = (visit) =>
  visit
    .where((a) => a.type == util.actionTypes.visit)
    .groupBy((r) => r.url)
    .select((urlGroups) => urlGroups.first())
    .inflate();

export const toUniqueSuggestions = (visit) =>
  visit
    .where((a) => a.type == util.actionTypes.selectSuggestion)
    .groupBy((r) => r.suggestionSelection)
    .select((group) => group.first())
    .inflate();
