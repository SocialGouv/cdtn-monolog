import { some } from "fp-ts/Option";

import {
  formatDate,
  getLastDays,
  getLastThreeMonthsComplete,
} from "../readerUtil";

const testDate = new Date(1606227183865);

test("format dates", () => {
  expect(formatDate(testDate)).toBe("2020-11-24");
});

test("get last days", () => {
  expect(getLastDays(2, testDate)).toStrictEqual(["2020-11-23", "2020-11-22"]);
});

test("get last months", () => {
  expect(getLastThreeMonthsComplete(some(testDate))).toMatchSnapshot();
});
