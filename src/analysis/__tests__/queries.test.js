// import * as util from "../../util";
// import * as path from "path";
import { getRouteBySource, SOURCES } from "@socialgouv/cdtn-sources";
import { DataFrame } from "data-forge";

import { actionTypes } from "../../util";
import { analyse, buildCache } from "../queries";

require("./__mocking__/mockCdtnApi");

jest.mock("../../cdtnApi");

describe("Query reports", () => {
  const toSearchAction = (uvi, query) => ({
    query,
    resultSelection: undefined,
    type: actionTypes.search,
    uvi,
  });

  const generateSearchVisit = (visit) =>
    new DataFrame(visit.map(([uvi, query]) => toSearchAction(uvi, query)));

  const toSelectionAction = (uvi, selections) =>
    selections.map((selection) => ({
      query: undefined,
      resultSelection: selection,
      type: actionTypes.selectResult,
      uvi,
    }));

  const generateSearchAndSelectVisit = (visit) =>
    new DataFrame({
      columnNames: ["type", "uvi", "query", "resultSelection"],
      values: visit.flatMap(([uvi, [query, selections]]) => [
        toSearchAction(uvi, query),
        ...toSelectionAction(uvi, selections),
      ]),
    });

  const createSelection = (source, slug, algo = "pre-qualified") => ({
    algo,
    url: `/${source}/${slug}`,
  });

  it("should generate cache for each search query", async () => {
    const visits = [
      "paternite",
      "conge maternite",
      "conge de maternite",
    ].map((query, i) => [[i, query]]);

    const df = DataFrame.concat(visits.map(generateSearchVisit));

    const cache = await buildCache(df, 0);

    expect(cache).toMatchSnapshot();
  });

  it("should keep counts for searches and selections in every visit", async () => {
    const pa1 = createSelection(
      getRouteBySource(SOURCES.SHEET_SP),
      "conge-de-paternite-et-daccueil-de-lenfant-dun-salarie-du-secteur-prive"
    );
    const pa2 = createSelection(
      getRouteBySource(SOURCES.SHEET_MT),
      "le-conge-de-paternite-et-daccueil-de-lenfant#Quelle-est-la-duree-du-conge-de-paternite-et-d-accueil-de-l-enfant-nbsp"
    );
    const ma1 = createSelection(
      getRouteBySource(SOURCES.CONTRIBUTIONS),
      "quelle-est-la-duree-du-conge-de-maternite"
    );
    const ma2 = createSelection(
      getRouteBySource(SOURCES.CONTRIBUTIONS),
      "quelles-sont-les-conditions-dindemnisation-pendant-le-conge-de-maternite"
    );

    const visitsAndSelections = [
      ["paternite", [pa1, pa2]],
      ["paternite", [pa2]],
      ["paternite", [pa2]],
      ["conge maternite", [ma1]],
      ["conge de maternite", [ma1]],
      ["conge de maternite", [ma2]],
    ].map((querySelections, i) => [[i, querySelections]]);

    const df = DataFrame.concat(
      visitsAndSelections.map(generateSearchAndSelectVisit)
    );

    const reports = await analyse(df, 42);

    expect(reports).toMatchSnapshot();
  });
});
