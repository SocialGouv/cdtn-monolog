import { DataFrame } from "data-forge";

import * as mrp from "../monthlyReport.js";
import * as mockdt from "./dataset_mock.js";

describe("test utils", () => {
  const date1 = new Date("2020-03-12");
  const date2 = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));
  const date3 = new Date("2020-10-02");
  it("should extract month", () => {
    const extractedMonth1 = mrp.extractMonth(date1);
    const extractedMonth2 = mrp.extractMonth(date2);
    const extractedMonth3 = mrp.extractMonth(date3);
    expect(extractedMonth1).toBe("2020-3");
    expect(extractedMonth2).toBe("2012-12");
    expect(extractedMonth3).toBe("2020-10");
  });
  it("should get the first day of the week (monday) of any date", () => {
    const mondayDate1 = mrp.getWeekMonday(date1);
    const mondayDate2 = mrp.getWeekMonday(date2);
    const mondayDate3 = mrp.getWeekMonday(date3);
    expect(mondayDate1).toBe("03/09/20");
    expect(mondayDate2).toBe("12/17/12");
    expect(mondayDate3).toBe("09/28/20");
  });
  it("should get the max of count of an array of object", () => {
    const arr = [
      { month: "2020-8", nbUniqueVisits: 16 },
      { month: "2020-8", nbUniqueVisits: 16 },
      { month: "2020-4", nbUniqueVisits: 12 },
      { month: "2020-4", nbUniqueVisits: 2 },
    ];
    const arr2 = [];
    const max = mrp.getMaxDay(arr);
    const max2 = mrp.getMaxDay(arr2);
    expect(max).toStrictEqual({ month: "2020-8", nbUniqueVisits: 16 });
    expect(max2).toBe(undefined);
  });
});

describe("test analysis", () => {
  const mockdf = new DataFrame(mockdt.dataset).parseDates("lastActionDateTime");
  const dedupMockdf = mockdf.distinct((row) => row.uvi);
  const expected = [
    { day: "03/30/20", nbUniqueVisits: 3 },
    { day: "09/29/20", nbUniqueVisits: 1 },
    { day: "09/30/20", nbUniqueVisits: 4 },
    { day: "12/30/20", nbUniqueVisits: 2 },
  ];
  it("should aggregates daily visits", () => {
    const res = mrp.getDailyVisits(mockdf);
    expect(res).toStrictEqual(expected);
  });
  it("should aggregate weekly visits", () => {
    const res = mrp.getWeeklyVisits(mockdf);
    expect(res).toStrictEqual([
      { nbUniqueVisits: 3, weekMonday: "03/30/20" },
      { nbUniqueVisits: 5, weekMonday: "09/28/20" },
      { nbUniqueVisits: 2, weekMonday: "12/28/20" },
    ]);
  });
  it("should aggregate monthly visits", () => {
    const res = mrp.getMonthlyVisits(mockdf);
    expect(res).toStrictEqual([
      { month: "2020-3", nbUniqueVisits: 3 },
      { month: "2020-9", nbUniqueVisits: 5 },
      { month: "2020-12", nbUniqueVisits: 2 },
    ]);
  });
  it("should deduplicate before aggregating", () => {
    const res2 = mrp.getDailyVisits(dedupMockdf);
    expect(res2).toStrictEqual([
      { day: "03/30/20", nbUniqueVisits: 1 },
      { day: "09/29/20", nbUniqueVisits: 1 },
      { day: "09/30/20", nbUniqueVisits: 1 },
    ]);
    expect(res2).not.toStrictEqual(expected);
  });
});
