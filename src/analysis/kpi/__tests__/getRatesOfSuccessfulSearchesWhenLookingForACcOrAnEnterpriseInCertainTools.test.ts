import { DataFrame } from "data-forge";

import { getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools } from "../getRateOfSuccessfulSearchWhenLookingForACc";

describe("#getRateOfGivenTypeOverAnOtherInDfWithoutDuplicates", () => {
  it("should count occurrences of a type (being the denominator) and another type (begin the numerator) in a df after removing duplicates and return the two counts and the rate", () => {
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
    const expected = [
      { denominator: 4, numerator: 3, rate: 75 },
      { denominator: 0, numerator: 1, rate: 0 },
    ];
    // When
    const result =
      getRatesOfSuccessfulSearchesWhenLookingForACcOrAnEnterpriseInCertainTools(
        dataset
      );

    // Then
    expect(result).toStrictEqual(expected);
  });
});
