import { parseISO } from "date-fns";

const analyse = (dataset) => {
  const counts = dataset.getSeries("count");
  const startDate = dataset
    .getSeries("day")
    .select((d) => parseISO(d))
    .min();
  const nbVisits = counts.sum();
  const maxDailyVisits = counts.max();
  const averageDailyVisits = Math.floor(counts.average());

  return { averageDailyVisits, maxDailyVisits, nbVisits, startDate };
};

export { analyse };
