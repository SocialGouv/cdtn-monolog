import { DataFrame } from "data-forge";

import { computeReports, joinOuter3Df, removeAnchor } from "../popularity";

describe("Cdtn popularity", () => {
  it("removeAnchor should return the website url", async () => {
    const res = removeAnchor(
      "CDTN/outil/préavis-demission?xtor=AD-1-[]-[]-[]-[AMNET]-[]-[]\n"
    );
    expect(res).toBe("cdtn/outil/préavis-demission");
  });
  it("removeAnchor should return the website url s", async () => {
    const res = removeAnchor(
      "information/indemnite-inflation-infographies?test"
    );
    expect(res).toBe("information/indemnite-inflation-infographies");
  });
  it("removeAnchor should return the website before ? and #", async () => {
    const res = removeAnchor("convention-collective#santé#travail?tests");
    expect(res).toBe("convention-collective");
  });
  describe("#joinOuter3Df", () => {
    it("should return dataframes joined on column 'field'", async () => {
      // Given
      const data1 = [
        { count: 9000, field: "indemnite-licenc", normalized_count: 1 },
        { count: 10000, field: "outil1", normalized_count: 1 },
        { count: 11000, field: "outil2", normalized_count: 1 },
      ];
      const data2 = [
        { count: 9, field: "indemnite-licenc", normalized_count: 1 },
        { count: 10, field: "outil1", normalized_count: 1 },
        { count: 11, field: "outil3", normalized_count: 1 },
      ];
      const data3 = [
        { count: 100, field: "indemnite-licenc", normalized_count: 1 },
        { count: 50, field: "outil4", normalized_count: 1 },
        { count: 50, field: "", normalized_count: 1 },
      ];
      const df1 = new DataFrame(data1);
      const df2 = new DataFrame(data2);
      const df3 = new DataFrame(data3);
      const expectedData = [
        {
          field: "indemnite-licenc",
          m0_count: 9000,
          m0_norm_count: 1,
          m1_count: 9,
          m1_norm_count: 1,
          m2_count: 100,
        },
        {
          field: "outil1",
          m0_count: 10000,
          m0_norm_count: 1,
          m1_count: 10,
          m1_norm_count: 1,
          m2_count: 0,
        },
        {
          field: "outil2",
          m0_count: 11000,
          m0_norm_count: 1,
          m1_count: 0,
          m1_norm_count: 0,
          m2_count: 0,
        },
        {
          field: "outil3",
          m0_count: 0,
          m0_norm_count: 0,
          m1_count: 11,
          m1_norm_count: 1,
          m2_count: 0,
        },
        {
          field: "outil4",
          m0_count: 0,
          m0_norm_count: 0,
          m1_count: 0,
          m1_norm_count: 0,
          m2_count: 50,
        },
        {
          field: "",
          m0_count: 0,
          m0_norm_count: 0,
          m1_count: 0,
          m1_norm_count: 0,
          m2_count: 50,
        },
      ];
      const expected = new DataFrame(expectedData);

      // When
      const result = joinOuter3Df(df1, df2, df3);

      // Then

      expect(result).toStrictEqual(expected);
    });
  });
  describe("#computeReports", () => {
    it("_____", async () => {
      // Given
      const focusCountsData = [
        { count: 1000, field: "covid19-protocole", normalized_count: 0.1 },
        { count: 900, field: "indemnite-licenciement", normalized_count: 0.09 },
        { count: 800, field: "simulateur-embauche", normalized_count: 0.08 },
        { count: 700, field: "les-conges-pour-events", normalized_count: 0.07 },
        { count: 600, field: "", normalized_count: 0.06 },
      ];
      const focusCounts = new DataFrame(focusCountsData);
      const refCountsData = [
        { count: 500, field: "simulateur-embauche", normalized_count: 0.05 },
        { count: 400, field: "indemnite-licenciement", normalized_count: 0.04 },
        { count: 300, field: "covid19-protocole", normalized_count: 0.03 },
        { count: 200, field: "les-conges-pour-events", normalized_count: 0.02 },
        { count: 100, field: "rupture-du-contrat", normalized_count: 0.01 },
      ];
      const refCounts = new DataFrame(refCountsData);
      const previousMonthCountData = [
        { count: 50, field: "simulateur-embauche", normalized_count: 0.5 },
        { count: 40, field: "indemnite-licenciement", normalized_count: 0.4 },
        { count: 30, field: "les-conges-pour-events", normalized_count: 0.3 },
        { count: 20, field: "", normalized_count: 0.2 },
        { count: 10, field: "convention-collective", normalized_count: 0.1 },
      ];
      const previousMonthCount = new DataFrame(previousMonthCountData);
      const focusStart = 1641024090;
      const refStart = 1638345606;
      const prevStart = 1635753609;
      const reportId = "12022";
      const reportType = "content-popularity";
      const expected = [
        {
          doc: {
            abs_diff: 0.07,
            diff: 0.07,
            field: "covid19-protocole",
            m0_count: 1000,
            m0_norm_count: 0.1,
            m1_count: 300,
            m1_norm_count: 0.03,
            m2_count: 0,
            rel_diff: 2.3333333333333335,
          },
          m0_start: focusStart * 1000,
          m1_start: refStart * 1000,
          m2_start: prevStart * 1000,
          reportId,
          reportType,
        },
        {
          doc: {
            abs_diff: 0.05,
            diff: 0.05,
            field: "les-conges-pour-events",
            m0_count: 700,
            m0_norm_count: 0.07,
            m1_count: 200,
            m1_norm_count: 0.02,
            m2_count: 30,
            rel_diff: 2.5,
          },
          m0_start: focusStart * 1000,
          m1_start: refStart * 1000,
          m2_start: prevStart * 1000,
          reportId,
          reportType,
        },
        {
          doc: {
            abs_diff: 0.049999999999999996,
            diff: 0.049999999999999996,
            field: "indemnite-licenciement",
            m0_count: 900,
            m0_norm_count: 0.09,
            m1_count: 400,
            m1_norm_count: 0.04,
            m2_count: 40,
            rel_diff: 5 / 4,
          },
          m0_start: focusStart * 1000,
          m1_start: refStart * 1000,
          m2_start: prevStart * 1000,
          reportId,
          reportType,
        },
        {
          doc: {
            abs_diff: 0.03,
            diff: 0.03,
            field: "simulateur-embauche",
            m0_count: 800,
            m0_norm_count: 0.08,
            m1_count: 500,
            m1_norm_count: 0.05,
            m2_count: 50,
            rel_diff: 3 / 5,
          },
          m0_start: focusStart * 1000,
          m1_start: refStart * 1000,
          m2_start: prevStart * 1000,
          reportId,
          reportType,
        },
        {
          doc: {
            abs_diff: 0.01,
            diff: -0.01,
            field: "rupture-du-contrat",
            m0_count: 0,
            m0_norm_count: 0,
            m1_count: 100,
            m1_norm_count: 0.01,
            m2_count: 0,
            rel_diff: -1,
          },
          m0_start: focusStart * 1000,
          m1_start: refStart * 1000,
          m2_start: prevStart * 1000,
          reportId,
          reportType,
        },
      ];

      // When
      const res = computeReports(
        focusCounts,
        refCounts,
        previousMonthCount,
        focusStart,
        refStart,
        prevStart,
        reportId,
        reportType
      );

      // Then
      expect(res.length).toBe(5);
      expect(res).toStrictEqual(expected);
    });
  });
});
