import { IDataFrame } from "data-forge";

import { filterDataframeByUrlWithPrefix } from "../kpi";

const WIDGETS_LIST = [
  {
    name: "Préavis de licenciement",
    url: "https://code.travail.gouv.fr/widgets/preavis-licenciement",
  },
  {
    name: "Préavis de retraite",
    url: "https://code.travail.gouv.fr/widgets/preavis-retraite",
  },
];
export const computeWidgetsVisitsSources = (
  logs: IDataFrame,
  startDate: Date,
  reportId: string = new Date().getTime().toString()
): any[] => {
  const subsetLogs = logs.subset(["url", "type", "referrerTypeName", "referrerName", "idVisit"]);

  return WIDGETS_LIST.map((widget) => {
    return filterDataframeByUrlWithPrefix(subsetLogs, widget.url)
      .filter((log) => log.type == "visit_content")
      .filter((log) => log.referrerTypeName == "Websites")
      .groupBy((log) => [log.url, log.referrerName])
      .select((group) => ({
        kpi_type: "Widgets-visits-sources",
        reportId: reportId,
        reportType: "kpi",
        source: group.first().referrerName,
        startDate,
        visits: group
          .deflate((row) => row.idVisit)
          .distinct()
          .count(),
        widget: widget.name,
      }))
      .filter((log) => log.visits > 5)
      .orderBy((row) => row.source)
      .toArray();
  }).flat();
};
