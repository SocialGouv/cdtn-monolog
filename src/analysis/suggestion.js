import * as DatasetUtil from "../dataset";
import * as DataForge from "data-forge";

const analyse = (dataset) => {
  // get unique suggestion selection events in visits
  const uniqueSuggs = DataForge.DataFrame.concat(
    DatasetUtil.getVisits(dataset)
      .select((v) => DatasetUtil.toUniqueSuggestions(v))
      .where((v) => v.count() > 0)
      .toArray()
  ).deflate((r) => r.suggestionSelection);

  const total = uniqueSuggs.count();

  const normalisation = (c) => 100 * Math.sqrt(c / total);
  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  // count selections for each suggestion
  const counts = uniqueSuggs
    .groupBy((value) => value)
    .select((suggGroup) => ({
      suggestion: suggGroup.first(),
      count: suggGroup.count(),
      weight: round(normalisation(suggGroup.count())),
    }))
    .inflate()
    .orderByDescending((r) => r.weight);

  return counts.toArray();
};

export { analyse };
