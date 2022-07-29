import { DataFrame } from "data-forge";

import { getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools } from "../getRateOfSuccessfulSearchWhenLookingForACc";

describe("#getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools", () => {
  it("should return dict KpiReport with numerator, denominator and rate of successful cc or enterprise searches in tools", () => {
    // Given
    const data = [
      { idVisit: 0, type: "cc_search", url: "https://code.travail.gouv.fr/outils/preavis-demission" },
      { idVisit: 0, type: "cc_select_p1", url: "https://code.travail.gouv.fr/outils/preavis-demission" },
      { idVisit: 1, type: "cc_search", url: "https://code.travail.gouv.fr/outils/indemnite-precarite" },
      { idVisit: 1, type: "cc_search", url: "https://code.travail.gouv.fr/outils/indemnite-precarite" },
      { idVisit: 1, type: "cc_search", url: "https://code.travail.gouv.fr/outils/indemnite-precarite" },
      { idVisit: 1, type: "cc_search", url: "https://code.travail.gouv.fr/outils/indemnite-precarite" },
      { idVisit: 1, type: "cc_select_p1", url: "https://code.travail.gouv.fr/outils/indemnite-precarite" },
      { idVisit: 2, type: "cc_search", url: "https://code.travail.gouv.fr/outils/preavis-licenciement" },
      { idVisit: 2, type: "cc_select_p1", url: "https://code.travail.gouv.fr/outils/preavis-licenciement" },
      { idVisit: 2, type: "cc_search", url: "https://code.travail.gouv.fr/outils/preavis-retraite" },
      { idVisit: 2, type: "cc_search", url: "https://code.travail.gouv.fr/outils/un-autre-outil" },
      { idVisit: 2, type: "cc_select_p1", url: "https://code.travail.gouv.fr/outils/un-autre-outil" },
      { idVisit: 3, type: "enterprise_search", url: "https://code.travail.gouv.fr/outils/un-autre-outil" },
      { idVisit: 3, type: "enterprise_select", url: "https://code.travail.gouv.fr/outils/un-autre-outil" },
      { idVisit: 4, type: "enterprise_select", url: "https://code.travail.gouv.fr/outils/convention-collective" },
    ];
    const dataset = new DataFrame(data);
    const date = new Date("2020-01-01T00:00:00.000");
    const expected = [
      {
        denominator: 4,
        kpi_type: "Rate-of-successful-results-when-searching-cc-in-tools",
        numerator: 3,
        outil: "",
        rate: 75,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
      {
        denominator: 0,
        kpi_type:
          "Rate-of-successful-results-when-searching-enterprise-in-tools",
        numerator: 1,
        outil: "",
        rate: 0,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      },
    ];
    // When
    const result =
      getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools(
        dataset,
        date,
        "2020"
      );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
