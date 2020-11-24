/*
const AllVisitsDF = (dataframe) => ({
  getVisits() {
    return dataframe.groupBy((row) => row.uvi);
  },
});

export const Dataset = (dataframe) =>
  Object.assign(dataframe, AllVisitsDF(dataframe));
  */

import { IDataFrame, ISeries } from "data-forge";

import * as util from "./readerUtil";

export const getVisits = (dataframe: IDataFrame): ISeries =>
  dataframe.groupBy((row) => row.uvi);

// deduplicate views : for each visit, get unique content views grouping by url
export const toUniqueViews = (visit: IDataFrame): IDataFrame =>
  visit
    .where((a) => a.type == util.actionTypes.visit)
    .groupBy((r) => r.url)
    .select((urlGroups) => urlGroups.first())
    .inflate();

export const toUniqueSuggestions = (visit: IDataFrame): IDataFrame =>
  visit
    .where((a) => a.type == util.actionTypes.selectSuggestion)
    .groupBy((r) => r.suggestionSelection)
    .select((group) => group.first())
    .inflate();
