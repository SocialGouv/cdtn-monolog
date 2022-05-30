import { DataFrame } from "data-forge";

import {
  computeCompletionRateOfUrlTool,
  computeKpiRateVisitsOnCcPagesOnAllContribPages,
  computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib,
  computeRateOfCcSelectOverVisitsOnContribWithoutIdcc,
  countOccurrencesOfAGivenTypeInDf,
  dfContribDropDuplicates,
  filterDataframeByContrib,
  getConventionCollectiveCompletionRate,
  getListOfKpiCompletionRate,
  getNbVisitIfStepDefinedInTool,
  getNumberOfVisitsByCcType,
  getNumberOfVisitsByOutilAndEvent,
  getVisitsOnContribWithIdcc,
  getVisitsOnContribWithoutIdcc,
} from "../kpi";

describe("kpi", () => {
  describe("#getNumberOfVisitsByOutilAndEvent", () => {
    it("should return list of visits by event and url", () => {
      const data = [
        {
          idVisit: 1,
          outil: "indemnite-licenc",
          outilEvent: "start",
        },
        {
          idVisit: 2,
          outil: "indemnite-licenc",
          outilEvent: "start",
        },
        {
          idVisit: 2,
          outil: "indemnite-licenc",
          outilEvent: "random",
        },
        { idVisit: 2, outil: "mon-outil", outilEvent: "start" },
        { idVisit: 2, outil: "mon-outil", outilEvent: "results" },
        { idVisit: 3, outil: "mon-outil", outilEvent: "aze" },
        { idVisit: 3, outil: "mon-outil", outilEvent: "start" },
        { idVisit: 3, outil: "mon-outil", outilEvent: "results" },
        { idVisit: 3, outil: "mon-outil", outilEvent: "results" },
        { idVisit: 4, outil: "mon-outil", outilEvent: "outil" },
        { idVisit: 4, outil: "mon-outil", outilEvent: "second" },
        { idVisit: 4, outil: "mon-outil", outilEvent: "results" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { nbVisit: 2, outil: "indemnite-licenc", outilEvent: "start" },
        { nbVisit: 1, outil: "indemnite-licenc", outilEvent: "random" },
        { nbVisit: 2, outil: "mon-outil", outilEvent: "start" },
        { nbVisit: 3, outil: "mon-outil", outilEvent: "results" },
        { nbVisit: 1, outil: "mon-outil", outilEvent: "aze" },
        { nbVisit: 1, outil: "mon-outil", outilEvent: "outil" },
        { nbVisit: 1, outil: "mon-outil", outilEvent: "second" },
      ];
      const datasetExpected = new DataFrame(dataExpected);
      // When
      const result = getNumberOfVisitsByOutilAndEvent(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
    it("should remove duplicates for a given visitor", () => {
      const data = [
        { idVisit: 5, outil: "preavis", outilEvent: "start" },
        { idVisit: 5, outil: "preavis", outilEvent: "start" },
        { idVisit: 5, outil: "preavis", outilEvent: "start" },
        { idVisit: 5, outil: "preavis", outilEvent: "start" },
        { idVisit: 5, outil: "preavis", outilEvent: "results" },
        { idVisit: 5, outil: "preavis", outilEvent: "results" },
        { idVisit: 5, outil: "preavis", outilEvent: "results" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { nbVisit: 1, outil: "preavis", outilEvent: "start" },
        { nbVisit: 1, outil: "preavis", outilEvent: "results" },
      ];
      const datasetExpected = new DataFrame(dataExpected);

      // When
      const result = getNumberOfVisitsByOutilAndEvent(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });

  describe("#getNbVisitIfStepDefinedInTool", () => {
    it("should return the number of visits for a given url and start step", () => {
      // Given
      const data = [
        { nbVisit: 10, outil: "simulateur-embauche", outilEvent: "start" },
        { nbVisit: 678, outil: "simulateur", outilEvent: "start" },
        { nbVisit: 8, outil: "simulateur-embauche", outilEvent: "result" },
        { nbVisit: 3, outil: "simulateur-embauche", outilEvent: "results" },
        { nbVisit: 9, outil: "simulateur-embauche", outilEvent: "inter" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = "start";
      const expected = 10;

      // When
      const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
    it("should return the number of visits for a given url and results step", () => {
      // Given
      const data = [
        { nbVisit: 10, outil: "simulateur-embauche", outilEvent: "start" },
        { nbVisit: 678, outil: "simulateur", outilEvent: "start" },
        { nbVisit: 8, outil: "simulateur-embauche", outilEvent: "result" },
        { nbVisit: 3, outil: "simulateur-embauche", outilEvent: "results" },
        { nbVisit: 9, outil: "simulateur-embauche", outilEvent: "inter" },
      ];
      const dataset = new DataFrame(data);
      const url = "simulateur-embauche";
      const step = "results";
      const expected = 3;

      // When
      const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

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
      const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

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
      const result = getNbVisitIfStepDefinedInTool(url, step, dataset);

      // Then
      expect(result).toStrictEqual(expected);
    });
  });

  describe("#getListOfKpiCompletionRate", () => {
    it("should return list of kpi completion rate by url", () => {
      // Given
      const data = [
        {
          nbVisit: 100,
          outil: "Heures pour recherche d’emploi",
          outilEvent: "start",
        },
        {
          nbVisit: 90,
          outil: "Heures pour recherche d’emploi",
          outilEvent: "results",
        },
        {
          nbVisit: 1111,
          outil: "Indemnité de licenciement",
          outilEvent: "start",
        },
        {
          nbVisit: 999,
          outil: "Indemnité de licenciement",
          outilEvent: "step1",
        },
        {
          nbVisit: 777,
          outil: "Indemnité de licenciement",
          outilEvent: "step2",
        },
        {
          nbVisit: 555,
          outil: "Indemnité de licenciement",
          outilEvent: "indemnite_legale",
        },
        {
          nbVisit: 900,
          outil: "Trouver sa convention collective",
          outilEvent: "start",
        },
        {
          nbVisit: 800,
          outil: "Trouver sa convention collective",
          outilEvent: "step",
        },
        {
          nbVisit: 700,
          outil: "Trouver sa convention collective",
          outilEvent: "results",
        },
      ];
      const dataset = new DataFrame(data);
      const date = new Date("2020-01-01T00:00:00.000");
      const expected = [
        {
          denominator: 100,
          kpi_type: "Completion-rate-of-tools",
          numerator: 90,
          outil: "Heures pour recherche d’emploi",
          rate: 0.9,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 1111,
          kpi_type: "Completion-rate-of-tools",
          numerator: 555,
          outil: "Indemnité de licenciement",
          rate: 555 / 1111,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 0,
          kpi_type: "Completion-rate-of-tools",
          numerator: 0,
          outil: "Indemnité de précarité",
          rate: 0,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
      ];
      // When
      const result = getListOfKpiCompletionRate(dataset, date, "2020");

      // Then
      expect(result[0]).toStrictEqual(expected[0]);
      expect(result[1]).toStrictEqual(expected[1]);
      expect(result[2]).toStrictEqual(expected[2]);
    });
  });

  describe("#getNumberOfVisitsByCcType", () => {
    it("should return a dataframe of number of visits by convention collective type", () => {
      // Given
      const data = [
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 3,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_select_p1",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "cc_select_p1",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "cc_select_traitée",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
      ];
      const dataset = new DataFrame(data);
      const expectedDataset = new DataFrame({
        index: ["cc_search", "cc_select_p1", "cc_select_traitée"],
        values: [{ nbVisit: 3 }, { nbVisit: 2 }, { nbVisit: 1 }],
      });

      // When
      const result = getNumberOfVisitsByCcType(dataset);

      // Then
      expect(result).toStrictEqual(expectedDataset);
    });
  });

  describe("#getConventionCollectiveCompletionRate", () => {
    it("should return a kpi completion rate for outil convention collective for P1", () => {
      // Given
      const data = [
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_select_p1",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
      ];
      const dataset = new DataFrame(data);
      const date = new Date("2020-01-01T00:00:00.000");
      const expected = {
        denominator: 2,
        kpi_type: "Completion-rate-of-tools",
        numerator: 1,
        outil: "Trouver sa convention collective",
        rate: 0.5,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      };
      // When
      const result = getConventionCollectiveCompletionRate(
        dataset,
        date,
        "2020"
      );

      // Then
      expect(result).toStrictEqual(expected);
    });
    it("should return a kpi completion rate for outil convention collective for P2", () => {
      // Given
      const data = [
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "enterprise_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          outil: "Trouver sa convention collective",
          type: "cc_select_p2",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "enterprise_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          outil: "Trouver sa convention collective",
          type: "cc_select_p2",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 3,
          outil: "Trouver sa convention collective",
          type: "enterprise_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
      ];
      const dataset = new DataFrame(data);
      const date = new Date("2020-01-01T00:00:00.000");
      const expected = {
        denominator: 3,
        kpi_type: "Completion-rate-of-tools",
        numerator: 2,
        outil: "Trouver sa convention collective",
        rate: 2 / 3,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      };
      // When
      const result = getConventionCollectiveCompletionRate(
        dataset,
        date,
        "2020"
      );

      // Then
      expect(result).toStrictEqual(expected);
    });
  });

  describe("#computeCompletionRateOfUrlTool - Integration test", () => {
    it("given a list of event, method should return kpis of completion rate by url", () => {
      // Given
      const date = new Date("2020-01-01T00:00:00.000");
      const data = [
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-05",
          outil: "Trouver sa convention collective",
          outilAction: "view_step",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-10",
          outil: "Trouver sa convention collective",
          outilAction: "view_step",
          type: "cc_select_p1",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-10",
          outil: "Trouver sa convention collective",
          outilAction: "view_step",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 2,
          lastActionDateTime: "2020-01-10",
          outil: "Trouver sa convention collective",
          outilAction: "view_step",
          type: "cc_search",
          url: "https://code.travail.gouv.fr/outils/convention-collective",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-10",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "start",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-10",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "compute",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-10",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "results",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-01",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-20",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 1,
          lastActionDateTime: "2020-01-20",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 2,
          lastActionDateTime: "2020-01-20",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "start",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 2,
          lastActionDateTime: "2020-01-20",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "compute",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 2,
          lastActionDateTime: "2020-01-20",
          outil: "Indemnité de licenciement",
          outilAction: "view_step",
          outilEvent: "indemnite_legale",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 3,
          lastActionDateTime: "2020-01-25",
          outil: "Indemnité de précarité",
          outilAction: "view_step",
          outilEvent: "start",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 3,
          lastActionDateTime: "2020-01-25",
          outil: "Indemnité de précarité",
          outilAction: "view_step",
          outilEvent: "indemnite",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 3,
          lastActionDateTime: "2020-01-25",
          outil: "Préavis de démission",
          outilAction: "view_step",
          outilEvent: "start",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 4,
          lastActionDateTime: "2020-01-25",
          outil: "Préavis de démission",
          outilAction: "view_step",
          outilEvent: "start",
          url: "https://code.travail.gouv.fr/outils/",
        },
        {
          idVisit: 4,
          lastActionDateTime: "2020-01-02",
          outil: "Préavis de démission",
          outilAction: "view_step",
          outilEvent: "results",
          url: "https://code.travail.gouv.fr/outils/",
        },
      ];
      const dataset = new DataFrame(data);
      const expected = [
        {
          denominator: 0,
          kpi_type: "Completion-rate-of-tools",
          numerator: 0,
          outil: "Heures pour recherche d’emploi",
          rate: 0,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 2,
          kpi_type: "Completion-rate-of-tools",
          numerator: 2,
          outil: "Indemnité de licenciement",
          rate: 1,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 1,
          kpi_type: "Completion-rate-of-tools",
          numerator: 1,
          outil: "Indemnité de précarité",
          rate: 1,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 2,
          kpi_type: "Completion-rate-of-tools",
          numerator: 1,
          outil: "Préavis de démission",
          rate: 0.5,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 0,
          kpi_type: "Completion-rate-of-tools",
          numerator: 0,
          outil: "Préavis de départ ou de mise à la retraite",
          rate: 0,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 2,
          kpi_type: "Completion-rate-of-tools",
          numerator: 1,
          outil: "Trouver sa convention collective",
          rate: 0.5,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
      ];
      // When
      const result = computeCompletionRateOfUrlTool(dataset, date, "2020");

      // Then
      expect(result.slice(0, 5)).toStrictEqual(expected.slice(0, 5));
    });
  });

  describe("#filterDataframeByContrib", () => {
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
      const result = filterDataframeByContrib(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });
  describe("#dfContribDropDuplicates", () => {
    it("should return df of contrib without duplicates", () => {
      const data = [
        { idVisit: 1, type: "cc_search", url: "mon-outil" },
        { idVisit: 1, type: "cc_search", url: "mon-outil" },
        { idVisit: 1, type: "cc_select", url: "mon-outil" },
        { idVisit: 2, type: "cc_search", url: "mon-outil" },
        { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
        { idVisit: 2, type: "cc_select", url: "mon-outil" },
        { idVisit: 2, type: "cc_select", url: "mon-autre-outil" },
        { idVisit: 3, type: "cc_search", url: "mon-outil" },
        { idVisit: 3, type: "cc_select", url: "mon-outil" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { idVisit: 1, type: "cc_search", url: "mon-outil" },
        { idVisit: 1, type: "cc_select", url: "mon-outil" },
        { idVisit: 2, type: "cc_search", url: "mon-outil" },
        { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
        { idVisit: 2, type: "cc_select", url: "mon-outil" },
        { idVisit: 2, type: "cc_select", url: "mon-autre-outil" },
        { idVisit: 3, type: "cc_search", url: "mon-outil" },
        { idVisit: 3, type: "cc_select", url: "mon-outil" },
      ];
      const datasetExpected = new DataFrame(dataExpected);
      // When
      const result = dfContribDropDuplicates(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });
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
  describe("#getVisitsOnContribWithIdcc", () => {
    it("should return df of contrib with only contrib with idcc", () => {
      const data = [
        { url: "https://code.travail.gouv.fr/contribution/mon-outil" },
        { url: "https://code.travail.gouv.fr/contribution/1234" },
        { url: "https://code.travail.gouv.fr/contribution/mon-outil1" },
      ];
      const dataset = new DataFrame(data);
      const dataExpected = [
        { url: "https://code.travail.gouv.fr/contribution/1234" },
      ];
      const datasetExpected = new DataFrame(dataExpected);
      // When
      const result = getVisitsOnContribWithIdcc(dataset);

      // Then
      expect(result).toStrictEqual(datasetExpected);
    });
  });
  describe("#countOccurrencesOfAGivenTypeInDf", () => {
    it("count the occurence of a given type in series type of a dataframe", () => {
      const data = [
        { idVisit: 1, type: "cc_search", url: "mon-outil" },
        { idVisit: 1, type: "visit_content", url: "mon-outil" },
        { idVisit: 1, type: "cc_select", url: "mon-outil" },
        { idVisit: 2, type: "visit_content", url: "mon-outil" },
        { idVisit: 2, type: "cc_search", url: "mon-autre-outil" },
        { idVisit: 2, type: "cc_select", url: "mon-outil" },
        { idVisit: 3, type: "visit_content", url: "mon-outil" },
      ];
      const dataset = new DataFrame(data);
      const expected = 3;
      // When
      const result = countOccurrencesOfAGivenTypeInDf(dataset, "visit_content");

      // Then
      expect(result).toStrictEqual(expected);
    });
  });
  describe("#computeRateOfCcSelectOverVisitsOnContrib", () => {
    it("should compute rate of persons selecting a cc in non-personalized contribution pages", () => {
      const data = [
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/123-page1",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/123-page1",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1-123456",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page-2",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/PAGE2",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/R3-page2",
        },
      ];
      const dataset = new DataFrame(data);
      const date = new Date("2020-01-01T00:00:00.000");
      const expected = {
        denominator: 4,
        kpi_type: "Rate-of-cc-select-on-pages-contribution-without-idcc",
        numerator: 3,
        outil: "pages-contribution",
        rate: 75,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      };
      // When
      const result = computeRateOfCcSelectOverVisitsOnContribWithoutIdcc(
        dataset,
        date,
        "2020"
      );

      // Then
      expect(result).toStrictEqual(expected);
    });
  });
  describe("#computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib", () => {
    it("should compute rate of persons getting a personalized pages in all contribution pages", () => {
      const date = new Date("2020-01-01T00:00:00.000");
      const data = [
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/123-page1",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/123-page1",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1-123456",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page-2",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/PAGE2",
        },
        {
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/R3-page2",
        },
        {
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page2",
        },
      ];
      const dataset = new DataFrame(data);
      const expected = {
        denominator: 6,
        kpi_type: "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
        numerator: 5,
        outil: "pages-contribution",
        rate: 83.333,
        reportId: "2020",
        reportType: "kpi",
        start_date: date,
      };
      // When
      const result = computeRateOfCcSelectAndNbCcPagesOverVisitsOnContrib(
        dataset,
        date,
        "2020"
      );

      // Then
      expect(result).toStrictEqual(expected);
    });
  });

  describe("#computeKpiRateVisitsOnCcPagesOnAllContribPages - Integration test", () => {
    it("should return list contrib with url formated", () => {
      const date = new Date("2020-01-01T00:00:00.000");
      const data = [
        {
          idVisit: 1,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page0",
        },
        {
          idVisit: 1,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          idVisit: 1,
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          idVisit: 1,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/123-page1",
        },
        {
          idVisit: 2,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
        {
          idVisit: 2,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1#3",
        },
        {
          idVisit: 2,
          type: "visit_content",
          url: "https://code.travail.gouv.fr/contribution/page1?az=2",
        },
        {
          idVisit: 2,
          type: "cc_select",
          url: "https://code.travail.gouv.fr/contribution/page1",
        },
      ];
      const dataset = new DataFrame(data);
      const expected = [
        {
          denominator: 3,
          kpi_type: "Rate-of-cc-select-on-pages-contribution-without-idcc",
          numerator: 2,
          outil: "pages-contribution",
          rate: 66.667,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
        {
          denominator: 4,
          kpi_type: "Rate-of-personalized-pages-and-cc-select-on-all-pages-contribution",
          numerator: 3,
          outil: "pages-contribution",
          rate: 75,
          reportId: "2020",
          reportType: "kpi",
          start_date: date,
        },
      ];
      // When
      const result = computeKpiRateVisitsOnCcPagesOnAllContribPages(
        dataset,
        date,
        "2020"
      );

      // Then
      expect(result).toStrictEqual(expected);
    });
  });
});
