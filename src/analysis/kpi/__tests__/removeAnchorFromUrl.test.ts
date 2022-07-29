import { DataFrame } from "data-forge";

import { removeAnchorFromUrl } from "../../kpi";

describe("#removeAnchorFromUrl", () => {
  it("should return dataframe of url without anchor", () => {
    // Given
    const data = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil#345" },
      { url: "https://code.travail.gouv.fr/contribution/1234?BDK457§n" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil1?45HB#GJD" },
      { url: "https://code.travail.gouv.fr/contribution/mon#GJD?45HB#GJD" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/1234" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil1" },
      { url: "https://code.travail.gouv.fr/contribution/mon" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = removeAnchorFromUrl(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
