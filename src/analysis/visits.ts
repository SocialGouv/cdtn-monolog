import { IDataFrame } from "data-forge";
import { parseISO } from "date-fns";

import { MonthlyReport } from "./reports.types";

const reportType = "monthly-report";

const analyse = (dataset: IDataFrame, reportId: string): MonthlyReport => {
  const counts = dataset.getSeries("count");
  const dates = dataset.getSeries("day").select((d) => parseISO(d));

  // logs start at 8am
  const min = new Date(dates.min());
  const startDate = min.setHours(min.getHours() + 8);
  const max = new Date(dates.max());
  const endDate = max.setHours(max.getHours() + 32);

  const nbVisits = counts.sum();
  const maxDailyVisits = counts.max();
  const maxDailyVisitsDay = dataset
    .where((r) => r.count == maxDailyVisits)
    .first().day;
  const averageDailyVisits = Math.floor(counts.average());

  const report = {
    averageDailyVisits,
    endDate,
    maxDailyVisits,
    maxDailyVisitsDay,
    nbVisits,
    reportId,
    reportType,
    startDate,
  };

  return report;
};

export { analyse };
