import { DataFrame } from "data-forge";

import {
  cleanUrl,
  computeCompletionRateOfUrlOutil,
  getListOfKpiCompletionRate,
  getNbVisitIfStepDefinedInOutil,
  getNumberOfVisitByUrlAndEvent,
} from "../kpi";

describe("kpi", () => {
  describe("#cleanUrl", () => {
    it("should return url without anchor", () => {
      // Given
      const data = [
        { idVisit: 1, url: "/outils/indemnite-licenciement?arg2" },
        { idVisit: 1, url: "/outils/indemnite-licenciement#20aij?arg2" },
        { idVisit: 2, url: "/outils/indemnite-licenciement?arg2=5" },
        { idVisit: 2, url: "/outils/indemnite-licenciement" },
        { idVisit: 2, url: "/outils/mon-outil" },
        { idVisit: 2, url: "/outils/mon-outil" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { idVisit: 1, url_cleaned: "indemnite-licenciement" },
        { idVisit: 1, url_cleaned: "indemnite-licenciement" },
        { idVisit: 2, url_cleaned: "indemnite-licenciement" },
        { idVisit: 2, url_cleaned: "indemnite-licenciement" },
        { idVisit: 2, url_cleaned: "mon-outil" },
        { idVisit: 2, url_cleaned: "mon-outil" },
      ];
      const datasetExpected = new DataFrame(dataExpected);
      // When
      const result = cleanUrl(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });

  describe("#getNumberOfVisitByUrlAndEvent", () => {
    it("should return list of visits by event and url", () => {
      const data = [
        {
          idVisit: 1,
          outilEvent: "start",
          url_cleaned: "/outils/indemnite-licenc",
        },
        {
          idVisit: 2,
          outilEvent: "start",
          url_cleaned: "/outils/indemnite-licenc",
        },
        {
          idVisit: 2,
          outilEvent: "random",
          url_cleaned: "/outils/indemnite-licenc",
        },
        { idVisit: 2, outilEvent: "start", url_cleaned: "/outils/mon-outil" },
        { idVisit: 2, outilEvent: "results", url_cleaned: "/outils/mon-outil" },
        { idVisit: 3, outilEvent: "aze", url_cleaned: "/outils/mon-outil" },
        { idVisit: 3, outilEvent: "start", url_cleaned: "/outils/mon-outil" },
        { idVisit: 3, outilEvent: "results", url_cleaned: "/outils/mon-outil" },
        { idVisit: 3, outilEvent: "results", url_cleaned: "/outils/mon-outil" },
        { idVisit: 4, outilEvent: "outil", url_cleaned: "/outils/mon-outil" },
        { idVisit: 4, outilEvent: "second", url_cleaned: "/outils/mon-outil" },
        { idVisit: 4, outilEvent: "results", url_cleaned: "/outils/mon-outil" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { nbVisit: 2, outilEvent: "start", url: "/outils/indemnite-licenc" },
        { nbVisit: 1, outilEvent: "random", url: "/outils/indemnite-licenc" },
        { nbVisit: 2, outilEvent: "start", url: "/outils/mon-outil" },
        { nbVisit: 3, outilEvent: "results", url: "/outils/mon-outil" },
        { nbVisit: 1, outilEvent: "aze", url: "/outils/mon-outil" },
        { nbVisit: 1, outilEvent: "outil", url: "/outils/mon-outil" },
        { nbVisit: 1, outilEvent: "second", url: "/outils/mon-outil" },
      ];
      const datasetExpected = new DataFrame(dataExpected);
      // When
      const result = getNumberOfVisitByUrlAndEvent(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
    it("should remove duplicates for a given visitor", () => {
      const data = [
        { idVisit: 5, outilEvent: "start", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "start", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "start", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "start", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "results", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "results", url_cleaned: "/outils/preavis" },
        { idVisit: 5, outilEvent: "results", url_cleaned: "/outils/preavis" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { nbVisit: 1, outilEvent: "start", url: "/outils/preavis" },
        { nbVisit: 1, outilEvent: "results", url: "/outils/preavis" },
      ];
      const datasetExpected = new DataFrame(dataExpected);

      // When
      const result = getNumberOfVisitByUrlAndEvent(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });

  describe("#getNbVisitIfStepDefinedInOutil", () => {
    it("should return the number of visits for a given url and start step", () => {
      // Given
      const data = [
        { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
        { nbVisit: 678, outilEvent: "start", url: "simulateur" },
        { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
        { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
        { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = "start";
      const expected = 10;

      // When
      const result = getNbVisitIfStepDefinedInOutil(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
    it("should return the number of visits for a given url and results step", () => {
      // Given
      const data = [
        { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
        { nbVisit: 678, outilEvent: "start", url: "simulateur" },
        { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
        { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
        { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = "results";
      const expected = 3;

      // When
      const result = getNbVisitIfStepDefinedInOutil(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
    it("should return 0 if the step is undefined", () => {
      // Given
      const data = [
        { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
        { nbVisit: 678, outilEvent: "start", url: "simulateur" },
        { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
        { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
        { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = undefined;
      const expected = 0;

      // When
      const result = getNbVisitIfStepDefinedInOutil(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
    it("should return 0 if there is no corresponding entries in the dataset", () => {
      // Given
      const data = [
        { nbVisit: 10, outilEvent: "start", url: "simulateur-embauche" },
        { nbVisit: 678, outilEvent: "start", url: "simulateur" },
        { nbVisit: 8, outilEvent: "result", url: "simulateur-embauche" },
        { nbVisit: 3, outilEvent: "results", url: "simulateur-embauche" },
        { nbVisit: 9, outilEvent: "inter", url: "simulateur-embauche" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = "step-finale";
      const expected = 0;

      // When
      const result = getNbVisitIfStepDefinedInOutil(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
  });

  describe("#getListOfKpiCompletionRate", () => {
    it("should return list of kpi completion rate by url", () => {
      // Given
      const data = [
        { nbVisit: 900, outilEvent: "start", url: "convention-collective" },
        { nbVisit: 800, outilEvent: "step", url: "convention-collective" },
        { nbVisit: 700, outilEvent: "results", url: "convention-collective" },
        { nbVisit: 100, outilEvent: "start", url: "heures-recherche-emploi" },
        { nbVisit: 90, outilEvent: "results", url: "heures-recherche-emploi" },
        { nbVisit: 1111, outilEvent: "start", url: "indemnite-licenciement" },
        { nbVisit: 999, outilEvent: "step1", url: "indemnite-licenciement" },
        { nbVisit: 777, outilEvent: "step2", url: "indemnite-licenciement" },
        {
          nbVisit: 555,
          outilEvent: "indemnite_legale",
          url: "indemnite-licenciement",
        },
      ];
      const dataset = new DataFrame(data);
      const expected = [
        {
          denominator: 900,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 0,
          rate: 0,
          start_date: "january",
          url: "convention-collective",
        },
        {
          denominator: 100,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 90,
          rate: 0.9,
          start_date: "january",
          url: "heures-recherche-emploi",
        },
        {
          denominator: 1111,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 555,
          rate: 555 / 1111,
          start_date: "january",
          url: "indemnite-licenciement",
        },
        {
          denominator: 0,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 0,
          rate: 0,
          start_date: "january",
          url: "indemnite-precarite",
        },
      ];
      // When
      const result = getListOfKpiCompletionRate(dataset);

      // Then
      expect(result[0]).toStrictEqual(expected[0]);
      expect(result[1]).toStrictEqual(expected[1]);
      expect(result[2]).toStrictEqual(expected[2]);
      expect(result[3]).toStrictEqual(expected[3]);
    });
  });

  describe("#computeCompletionRateOfUrlOutil - Integration test", () => {
    it("given a list of event, method should return kpis of completion rate by url", () => {
      // Given
      const data = [
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/convention-collective?arg2",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "step1",
          url: "/outils/convention-collective#aze",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "step2",
          url: "/outils/convention-collective",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "convention-collective",
          url: "/outils/convention-collective",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/indemnite-licenciement#20aij?arg2",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "compute",
          url: "/outils/indemnite-licenciement",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "results",
          url: "/outils/indemnite-licenciement?arg2=5",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "/outils/indemnite-licenciement?arg2=5",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "/outils/indemnite-licenciement?arg2=5",
        },
        {
          idVisit: 1,
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "/outils/indemnite-licenciement?arg2=5",
        },
        {
          idVisit: 2,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/indemnite-licenciement",
        },
        {
          idVisit: 2,
          outilAction: "view_step",
          outilEvent: "compute",
          url: "/outils/indemnite-licenciement",
        },
        {
          idVisit: 2,
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "/outils/indemnite-licenciement",
        },
        {
          idVisit: 3,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/indemnite-precarite?fgh",
        },
        {
          idVisit: 3,
          outilAction: "view_step",
          outilEvent: "indemnite",
          url: "/outils/indemnite-precarite?fgh",
        },
        {
          idVisit: 3,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/preavis-demission",
        },
        {
          idVisit: 4,
          outilAction: "view_step",
          outilEvent: "start",
          url: "/outils/preavis-demission",
        },
        {
          idVisit: 4,
          outilAction: "view_step",
          outilEvent: "results",
          url: "/outils/preavis-demission",
        },
      ];
      const dataset = new DataFrame(data);
      const expected = [
        {
          denominator: 1,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 0,
          rate: 0,
          start_date: "january",
          url: "convention-collective",
        },
        {
          denominator: 0,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 0,
          rate: 0,
          start_date: "january",
          url: "heures-recherche-emploi",
        },
        {
          denominator: 2,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 2,
          rate: 1,
          start_date: "january",
          url: "indemnite-licenciement",
        },
        {
          denominator: 1,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 1,
          rate: 1,
          start_date: "january",
          url: "indemnite-precarite",
        },
        {
          denominator: 2,
          kpi_type: "Completion rate of /outils/ urls",
          numerator: 1,
          rate: 0.5,
          start_date: "january",
          url: "preavis-demission",
        },
      ];
      // When
      const result = computeCompletionRateOfUrlOutil(dataset);

      // Then
      expect(result.slice(0, 5)).toStrictEqual(expected.slice(0, 5));
    });
  });
});
