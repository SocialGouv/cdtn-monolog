import { DataFrame } from "data-forge";

import { computeWidgetsVisitsSources } from "../computeWidgetsVisitsSources";

describe("#computeWidgetsVisitsSources - Integration test", () => {
  it("given a list of event, method should return kpis of visits on each widgets grouped by sources (referrer)", () => {
    // Given
    const date = new Date("2020-01-01T00:00:00.000");
    const data = [
      {
        idVisit: 1,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.toignore.fr",
        referrerTypeName: "Websites",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-licenciement",
      },
      {
        idVisit: 1,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.mercipourlinfo.fr",
        referrerTypeName: "Websites",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-licenciement",
      },
    ];

    for (let i = 0; i < 11; i++) {
      data.push({
        idVisit: i,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.mercipourlinfo.fr",
        referrerTypeName: "Websites",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-licenciement",
      });
      data.push({
        idVisit: i,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.mercipourlinfo.fr",
        referrerTypeName: "Websites",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-retraite",
      });
      data.push({
        idVisit: i,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.helloworkplace.fr",
        referrerTypeName: "Websites",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-retraite",
      });
      data.push({
        idVisit: i,
        lastActionDateTime: "2020-01-05",
        referrerName: "www.mercipourlinfo.fr",
        referrerTypeName: "Direct Entry",
        type: "visit_content",
        url: "https://code.travail.gouv.fr/widgets/preavis-retraite",
      });
    }
    const dataset = new DataFrame(data);
    const expected = [
      {
        kpi_type: "Widgets-visits-sources",
        reportId: "2020",
        reportType: "kpi",
        source: "www.mercipourlinfo.fr",
        startDate: date,
        visits: 11,
        widget: "Préavis de licenciement",
      },
      {
        kpi_type: "Widgets-visits-sources",
        reportId: "2020",
        reportType: "kpi",
        source: "www.helloworkplace.fr",
        startDate: date,
        visits: 11,
        widget: "Préavis de retraite",
      },

      {
        kpi_type: "Widgets-visits-sources",
        reportId: "2020",
        reportType: "kpi",
        source: "www.mercipourlinfo.fr",
        startDate: date,
        visits: 11,
        widget: "Préavis de retraite",
      },
    ];
    // When
    const result = computeWidgetsVisitsSources(dataset, date, "2020");

    // Then
    expect(result.slice(0, 8)).toStrictEqual(expected.slice(0, 8));
  });
});
