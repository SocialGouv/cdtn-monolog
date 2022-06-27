import { DataFrame } from "data-forge";

import { filterDataframeByContribAndRemoveAnchorFromUrl } from "../../kpi";

describe("#filterDataframeByContribAndRemoveAnchorFromUrl", () => {
  it("should return list contrib with url formated", () => {
    const data = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil?edrfgh" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil#dfvgbhn" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil?cdj#fhj" },
      { url: undefined },
      { url: "https://code.travail.gouv.fr/convention/mon-outil" },
      { url: "https://code.travail.gouv.fr/convention/mon-outil" },
    ];
    const dataset = new DataFrame(data);
    const dataExpected = [
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
      { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
    ];
    const datasetExpected = new DataFrame(dataExpected);
    // When
    const result = filterDataframeByContribAndRemoveAnchorFromUrl(dataset);

    // Then
    expect(result).toStrictEqual(datasetExpected);
  });
});
