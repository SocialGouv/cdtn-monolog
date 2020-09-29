import { DataFrame } from "data-forge";

// import * as util from "../../util";
// import * as path from "path";
import { actionTypes } from "../../util";
import { analyse, buildCache } from "../queries";

describe("Query reports", () => {
  const toSearchSelectionAction = (uvi, query) => ({
    query,
    type: actionTypes.search,
    uvi,
  });

  const generate = (visit) =>
    new DataFrame(visit.map(([uvi, ss]) => toSearchSelectionAction(uvi, ss)));

  it("should generate cache for each search query", async () => {
    const visits = [
      "paternite",
      "conges maternite",
      "conge de maternite",
    ].map((query, i) => [[i, query]]);

    const df = DataFrame.concat(visits.map(generate));

    const cache = await buildCache(df);

    expect(cache).toMatchSnapshot();
  });

  it("should keep counts for searches and selections in every visit", async () => {
    const visits = [
      "paternite",
      "conges maternite",
      "conge de maternite",
    ].map((query, i) => [[i, query]]);

    const df = DataFrame.concat(visits.map(generate));

    const reports = await analyse(df);
    expect(reports).toMatchSnapshot();
  });

  it("should compute scores for each query cluster", () => {});

  it("should generate the report from data", () => {});
});
