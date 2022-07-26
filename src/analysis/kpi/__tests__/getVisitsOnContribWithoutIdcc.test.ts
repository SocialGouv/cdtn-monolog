import { DataFrame } from "data-forge";

import { getVisitsOnContribWithoutIdcc } from "../../kpi";

describe("#getVisitsOnContribWithoutIdcc", () => {
  it("should return df of contribu without contrib with idcc", () => {
    const data = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/1234" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil1" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil1" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = getVisitsOnContribWithoutIdcc(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
