import { IDataFrame } from "data-forge";
import { setDate, subMonths } from "date-fns";
import { pipe } from "fp-ts/lib/function";
import { getOrElse, none, Option } from "fp-ts/Option";

import { removeArr } from "./themeNames";

export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url: string): string => {
  if (url.startsWith(SERVICE_URL)) {
    return url.slice(SERVICE_URL.length);
  } else {
    return url;
  }
};

export const formatDate = (date: Date): string =>
  date.toISOString().split("T")[0];

export const getLastDays = (n: number, ref: Date): string[] => {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;

  const createDate = (i: number) =>
    new Date(ref.getTime() - (i + 1) * dayMillis);

  return [...Array(n).keys()].map(createDate).map(formatDate);
};

/**
 *  return days of previous month
 *  month : 12 / year : 2020 will return all days in november 2020
 * @param month
 * @param year
 */
export const getDaysInPrevMonth = (month: number, year: number): string[] => {
  const date = subMonths(new Date(year, month, 1, 12), 1); // remove one month --> last finished month
  const currentMonth = date.getMonth();

  const days = [];
  while (date.getMonth() === currentMonth) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days.map(formatDate);
};

export const getLastMonthsComplete = (
  ref: Option<Date> = none,
  n: Option<number> = none
): string[][] => {
  // const end = setDate(getOrElse(() => new Date())(ref), 1);

  const end = pipe(
    ref,
    getOrElse(() => new Date()),
    (d: Date) => setDate(d, 1)
  );

  // we want the 3 last month by default
  const d = 3;
  const nMonths = pipe(
    n,
    getOrElse(() => d),
    (i) => Array(i).keys(),
    (a) => Array.from(a)
  );

  return nMonths
    .map((i) => subMonths(end, i))
    .map((d) => getDaysInPrevMonth(d.getMonth(), d.getFullYear()));
};

export const removeThemesQueries = (dataset: IDataFrame): IDataFrame => {
  return dataset.where((row) => !removeArr.has(row["query"]));
};

export const actionTypes = {
  feedback: "feedback",
  feedback_category: "feedback_category",
  feedback_suggestion: "feedback_suggestion",
  home: "home",
  search: "search",
  searchCC: "cc_search",
  selectCC: "cc_select",
  selectRelated: "select_related",
  selectResult: "select_result",
  selectSuggestion: "select_suggestion",
  themes: "themes",
  visit: "visit_content",
};
