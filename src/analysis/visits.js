import { parseISO } from "date-fns";

const analyse = (dataset, reportId) => {
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

  return {
    averageDailyVisits,
    endDate,
    maxDailyVisits,
    maxDailyVisitsDay,
    nbVisits,
    reportId,
    startDate,
  };
};

export { analyse };
