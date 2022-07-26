import { DataFrame } from "data-forge";

import { getNumberOfVisitsByCcType } from "../../kpi";

describe("#getNumberOfVisitsByCcType", () => {
  it("should return a dataframe of number of visits by convention collective type", () => {
    // Given
    const data = [
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 3,
        outil: "Trouver sa convention collective",
        type: "cc_search",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 1,
        outil: "Trouver sa convention collective",
        type: "cc_select_p1",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "cc_select_p1",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
      {
        idVisit: 2,
        outil: "Trouver sa convention collective",
        type: "cc_select_traitée",
        url: "https://code.travail.gouv.fr/outils/convention-collective",
      },
    ];
    const dataset = new DataFrame(data);
    const expectedDataset = new DataFrame({
      index: ["cc_search", "cc_select_p1", "cc_select_traitée"],
      values: [{ nbVisit: 3 }, { nbVisit: 2 }, { nbVisit: 1 }],
    });

    // When
    const result = getNumberOfVisitsByCcType(dataset);

    // Then
    expect(result).toStrictEqual(expectedDataset);
  });
});
