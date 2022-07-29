import { DataFrame } from "data-forge";

import { computeRateOfProcessedCcResultsOverAllResultsForAGivenTool } from "../computeRateOfProcessedCcResultsOverAllResultsByTools";

describe("#computeRateOfProcessedCcResultsOverAllResultsForAGivenTool", () => {
  it("should return rate of processed cc results over all results for tool preavis-demissio", () => {
    // Given
    const url_tool = "https://code.travail.gouv.fr/outils/preavis-demission";
    const tool_final_step = "results";
    const data = [
      {
        idVisit: "1",
        outilEvent: "_",
        type: "visit",
        url: "https://code.travail.gouv.fr/outils/",
      },
      {
        idVisit: "1",
        outilEvent: "start",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "select_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "select_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
      {
        idVisit: "2",
        outilEvent: "",
        type: "cc_select_non_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "2",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "3",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
    ];
    const dataset = new DataFrame(data);
    const expected = {
      nbVisitorsReachingResultStep: 3,
      nbVisitorsWhoHaveSelectedProcessedCcAndReachingResultStep: 1,
    };
    // When
    const result = computeRateOfProcessedCcResultsOverAllResultsForAGivenTool(
      url_tool,
      tool_final_step,
      dataset
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return rate of processed cc results over all results for tool heures-recherche-emploi", () => {
    const url_tool =
      "https://code.travail.gouv.fr/outils/heures-recherche-emploi";
    const tool_final_step = "results";
    const data = [
      {
        idVisit: "1",
        outilEvent: "_",
        type: "visit",
        url: "https://code.travail.gouv.fr/outils/",
      },
      {
        idVisit: "1",
        outilEvent: "start",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "select_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "results",
        type: "",
        url: "https://code.travail.gouv.fr/outils/preavis-demission",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
      {
        idVisit: "1",
        outilEvent: "info_cc",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/heures-recherche-emploi",
      },
    ];
    const dataset = new DataFrame(data);
    const expected = {
      nbVisitorsReachingResultStep: 0,
      nbVisitorsWhoHaveSelectedProcessedCcAndReachingResultStep: 0,
    };
    // When
    const result = computeRateOfProcessedCcResultsOverAllResultsForAGivenTool(
      url_tool,
      tool_final_step,
      dataset
    );
    // Then
    expect(result).toStrictEqual(expected);
  });
});
