import { DataFrame } from "data-forge";

import { getVisitsOnContribWithIdcc } from "../computeKpiRateVisitsOnCcPagesOnAllContribPages";

describe("#getVisitsOnContribWithIdcc", () => {
  it("should return df of contrib with only contrib with idcc", () => {
    // Given
    const data = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/1234" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil1" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [{ url: "https://code.travail.gouv.fr/contribution/1234" }];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = getVisitsOnContribWithIdcc(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
