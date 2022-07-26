import { IDataFrame } from "data-forge";

import * as util from "../../reader/readerUtil";
import {
  filterDataframeByToolAndRemoveAnchorFromUrl,
  filterDataframeByUrlWithPrefix,
} from "../kpi";
import { KpiReport } from "../reports";

const DICT_URL_TOOLS_STEPS = {
  "https://code.travail.gouv.fr/outils/heures-recherche-emploi": {
    tool_final_step: "results",
    tool_name: "Heures d'absence pour rechercher un emploi",
  },
  "https://code.travail.gouv.fr/outils/indemnite-precarite": {
    tool_final_step: "indemnite",
    tool_name: "Indemnité de précarité",
  },
  "https://code.travail.gouv.fr/outils/preavis-demission": {
    tool_final_step: "results",
    tool_name: "Préavis de démission",
  },
  "https://code.travail.gouv.fr/outils/preavis-licenciement": {
    tool_final_step: "results",
    tool_name: "Préavis de licenciement",
  },
  "https://code.travail.gouv.fr/outils/preavis-retraite": {
    tool_final_step: "result",
    tool_name: "Préavis de départ ou de mise à la retraite",
  },
};

/**
 * This function compute the number of visitors reaching the final step and
 *  number of visitors reaching the final step with a personalised result page with a CC processed by the tool
 *  for a given tool url with a given final step
 *
 * @param {string} url_tool - the url of the tool without any anchor
 * @param {string} tool_final_step - the step final step where the results are displayed
 * @param {IDataFrame} logsTools - the dataframe containing only logs for all tools
 **/
export function computeRateOfProcessedCcResultsOverAllResultsForAGivenTool(
  url_tool: string,
  tool_final_step: string,
  logsTools: IDataFrame<number, any>
): { [key: string]: number } {
  const logsForAGivenTool = filterDataframeByUrlWithPrefix(logsTools, url_tool);

  const allVisitorsReachingResultStep = logsForAGivenTool
    .filter((log) => log.outilEvent == tool_final_step)
    .getSeries("idVisit")
    .distinct()
    .toArray();
  const nbVisitorsReachingResultStep = allVisitorsReachingResultStep.length;

  const allVisitorsWhoHaveSelectedProcessedCc = logsForAGivenTool
    .filter((log) => log.type == util.actionTypes.selectProcessedCC)
    .getSeries("idVisit")
    .distinct()
    .toArray();
  const nbVisitorsWhoHaveSelectedProcessedCcAndReachingResultStep =
    allVisitorsReachingResultStep.filter((value) =>
      allVisitorsWhoHaveSelectedProcessedCc.includes(value)
    ).length;

  return {
    nbVisitorsReachingResultStep,
    nbVisitorsWhoHaveSelectedProcessedCcAndReachingResultStep,
  };
}

/**
 * This function compute the rate of visitors visiting the last step of a tool above all visitors reaching the last step,
 *  compute this ratio for all tools and return them in the form of a list of KpiReport
 *
 * @param {IDataFrame} logs - the dataframe containing all logs
 * @param {Date} startDate - the first day of the month using to order the report in kibana
 * @param {string} reportId - the timestamp in string of the date where the script is running
 **/
export const computeRateOfProcessedCcResultsOverAllResultsByTools = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): KpiReport[] => {
  // Get logs on tools and only take columns needed for performance
  const subsetLogs = logs.subset(["url", "type", "outilEvent", "idVisit"]);
  const logsTools =
    filterDataframeByToolAndRemoveAnchorFromUrl(subsetLogs).bake();

  return Object.entries(DICT_URL_TOOLS_STEPS).map(
    ([url_tool, tool_characteristics]) => {
      const r = computeRateOfProcessedCcResultsOverAllResultsForAGivenTool(
        url_tool,
        tool_characteristics.tool_final_step,
        logsTools
      );
      const denominator = r.nbVisitorsReachingResultStep;
      const numerator =
        r.nbVisitorsWhoHaveSelectedProcessedCcAndReachingResultStep;

      const rate =
        denominator > 0
          ? Math.round((numerator / denominator) * 10000) / 100
          : 0;
      return {
        denominator: denominator,
        kpi_type: "Rate-of-conventional-results-on-tools",
        numerator: numerator,
        outil: tool_characteristics.tool_name,
        rate: rate,
        reportId: reportId,
        reportType: "kpi",
        start_date: startDate,
      };
    }
  );
};
