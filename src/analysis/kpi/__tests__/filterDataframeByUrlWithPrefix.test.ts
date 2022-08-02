import { DataFrame } from "data-forge";

import { filterDataframeByUrlWithPrefix } from "../../kpi";

describe("#filterDataframeByUrlWithPrefix", () => {
  it("should return dataframe of url filtered with a given url", () => {
    // Given
    const data = [
      { url: "https://code.travail.gouv.fr/outils/mon-outil" },
      { url: "https://code.travail.gouv.fr/test/mon-outil#345" },
      { url: "https://code.travail.gouv.fr/contribution/1234?BDK457§n" },
      { url: "https://code.travail.gouv.fr/autre/mon-outil1?45HB#GJD" },
      { url: "https://code.travail.gouv.fr/contribution/mon#GJD?45HB#GJD" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { url: "https://code.travail.gouv.fr/contribution/1234?BDK457§n" },
      { url: "https://code.travail.gouv.fr/contribution/mon#GJD?45HB#GJD" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = filterDataframeByUrlWithPrefix(
      dataset,
      "https://code.travail.gouv.fr/contribution/"
    );

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
