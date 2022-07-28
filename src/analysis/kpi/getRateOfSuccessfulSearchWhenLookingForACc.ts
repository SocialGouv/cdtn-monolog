import { IDataFrame } from "data-forge";

import * as util from "../../reader/readerUtil";
import {
  filterDataframeByToolAndRemoveAnchorFromUrl,
  filterDataframeByUrlWithPrefix,
} from "../kpi";
import { KpiReport } from "../reports";

export const getRateOfSuccessfulSearchWhenLookingForACc = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  const subsetLogs = logs.subset(["url", "type", "idVisit"]);

  return [];
};
