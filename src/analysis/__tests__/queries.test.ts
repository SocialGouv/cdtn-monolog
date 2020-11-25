import { DataFrame } from "data-forge";

import { buildDataFrameFromQueries } from "../../__tests__/util";
import { buildCache } from "../../cdtn/resultCache";
import { actionTypes } from "../../reader/readerUtil";
import { analyse } from "../queries";

describe("Query reports", () => {
  const queries = [
    "contrat de travail",
    "apprentissage",
    "apprentissage",
    "grossesse",
    "grossesse",
    "grossesses",
    "Grossesse",
  ];

  const dataset = buildDataFrameFromQueries(queries);

  it("generate query reports", async () => {
    const cache = await buildCache(dataset, 2);

    const s = "/fiche-service-public/contrat-dapprentissage";

    const selections = new DataFrame([
      { query: "apprentissage", type: actionTypes.search, uvi: 1 },
      {
        resultSelection: s,
        type: actionTypes.selectResult,
        uvi: 1,
      },
    ]);

    const reports = analyse(selections, cache, new Set(["apprentissage"]), 42);

    expect(reports).toMatchSnapshot();
  });
});
