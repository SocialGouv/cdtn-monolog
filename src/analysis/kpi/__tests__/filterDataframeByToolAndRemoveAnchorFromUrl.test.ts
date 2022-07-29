import { DataFrame } from "data-forge";

import { filterDataframeByToolAndRemoveAnchorFromUrl } from "../../kpi";

describe("#filterDataframeByToolAndRemoveAnchorFromUrl", () => {
  it("should return df with url without anchor and beginning by https://code.travail.gouv.fr/outils/", () => {
    // Given
    const data = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/outils" },
      { url: "https://code.travail.gouv.fr/outils/" },
      { url: "https://code.travail.gouv.fr/outils/precarite" },
      { url: "https://code.travail.gouv.fr/outils/precarite?zertyu=4" },
      { url: "https://code.travail.gouv.fr/outils/indemnite#987" },
      { url: "https://code.travail.gouv.fr/outils/precarite?erty#987" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { url: "https://code.travail.gouv.fr/outils/" },
      { url: "https://code.travail.gouv.fr/outils/precarite" },
      { url: "https://code.travail.gouv.fr/outils/precarite" },
      { url: "https://code.travail.gouv.fr/outils/indemnite" },
      { url: "https://code.travail.gouv.fr/outils/precarite" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = filterDataframeByToolAndRemoveAnchorFromUrl(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
