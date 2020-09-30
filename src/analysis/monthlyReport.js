import { DataFrame } from "data-forge";

import * as datasetUtil from "../dataset";

// --- utils
var options = {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
};
const locale = "fr-FR";
export const extractMonth = (date) => {
  const month = date.getMonth() + 1; // months from 1-12
  const year = date.getFullYear(); //
  const dayMonth = year + "-" + month;
  return dayMonth;
};

export function getWeekMonday(date) {
  var d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toLocaleString(locale, options);
}
export const getMaxDay = (arr) => {
  const xMax = Math.max(...Array.from(arr, (o) => o.nbUniqueVisits));
  return arr.find((o) => o.nbUniqueVisits === xMax);
};
// ---- analysis functions
export const getWeeklyVisits = (dataset) => {
  const parsedDataFrame = dataset.transformSeries({
    lastActionDateTime: (columnValue) => getWeekMonday(columnValue),
  });
  return parsedDataFrame
    .groupBy((row) => row.lastActionDateTime)
    .select((group) => {
      return {
        nbUniqueVisits: group.count(),
        weekMonday: group.first().lastActionDateTime,
      };
    })
    .toArray();
};
export const getMonthlyVisits = (dataset) => {
  const parsedDataFrame = dataset.transformSeries({
    lastActionDateTime: (columnValue) => extractMonth(columnValue),
  });

  return parsedDataFrame
    .groupBy((row) => row.lastActionDateTime)
    .select((group) => {
      return {
        month: group.first().lastActionDateTime,
        nbUniqueVisits: group.count(),
      };
    })
    .toArray();
};
export const getDailyVisits = (dataset) => {
  const parsedDataFrame = dataset.transformSeries({
    lastActionDateTime: (columnValue) =>
      columnValue.toLocaleString(locale, options),
  });
  return parsedDataFrame
    .groupBy((row) => row.lastActionDateTime)
    .select((group) => {
      return {
        day: group.first().lastActionDateTime,
        nbUniqueVisits: group.count(),
      };
    })
    .toArray();
};
const analyse = (dataset, reportId) => {
  const rawLogs = datasetUtil.getVisits(dataset);
  //console.log(
  //  JSON.stringify(DataFrame.concat(rawLogs.toArray()).toArray().slice(0, 10))
  //);
  //general parsing (deduplicate by uvi and parse date into Date with moment.js)
  const uniqueVisitsDf = DataFrame.concat(rawLogs.toArray())
    .distinct((row) => row.uvi)
    .parseDates("lastActionDateTime");
  //console.log(JSON.stringify(uniqueVisitsDf.toArray().slice(0, 10)));

  // actual analysis
  const monthlyVisits = getMonthlyVisits(uniqueVisitsDf);
  const weeklyVisits = getWeeklyVisits(uniqueVisitsDf);
  const dailyVisits = getDailyVisits(uniqueVisitsDf);
  // current month
  const currentMonthDate = extractMonth(new Date());
  const SumvisitsThisMonth = monthlyVisits.filter(
    (obj) => obj.month === currentMonthDate
  )[0].nbUniqueVisits;
  const maxDailyVisitsThisMonth = getMaxDay(dailyVisits);

  const FinalAnalyse = {
    SumvisitsThisMonth: SumvisitsThisMonth,
    currentMonthDate: currentMonthDate,
    dailyVisits: JSON.stringify(dailyVisits),
    maxDailyVisitsThisMonth: maxDailyVisitsThisMonth,
    monthlyVisits: JSON.stringify(monthlyVisits),
    reportId: reportId,
    weeklyVisits: JSON.stringify(weeklyVisits),
  };
  return Array(FinalAnalyse);
};

export { analyse };
