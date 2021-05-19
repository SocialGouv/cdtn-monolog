import { DataFrame, IDataFrame } from "data-forge";

import { getVisits } from "../reader/dataset";
import { removeAnchor, urlToPath } from "./popularity";
import { satisfactionReport } from "./reports";

const noError = (action: any) =>
  ![
    "https://code.travail.gouv.fr/",
    "https://code.travail.gouv.fr/?xtor=ES-29-[BIE_202_20200130]-20200130-[https://code.travail.gouv.fr/]",
    "https://code.travail.gouv.fr/droit-du-travail",
  ].includes(action.url);


const getPageType = (x: string) => {
  const first = x.split("/")[0];
  return first;
};

const countURLs = (dataframe: IDataFrame) => {
  const dataframeFloat = dataframe.parseFloats("timeSpent");
  const counts = dataframeFloat
    .groupBy((row) => row.url)
    .select((group) => {
      return {
        avg_time_spent: group
          .deflate((g) => g.timeSpent)
          .where((x) => x !== undefined)
          .average(),
        feed_nb: group
          .where((row) => ["positive", "negative"].includes(row.feedbackType))
          .count(),
        select_related_out_nb: group
          .where((row) => row.type == "select_related")
          .count(),
        feed_negative: group
          .where((row) => row.feedbackType == "negative")
          .count(),
        feed_positive: group
          .where((row) => row.feedbackType == "positive")
          .count(),
        median_time_spent: group
          .deflate((g) => g.timeSpent)
          .where((x) => x !== undefined)
          .median(),
        page_name: group.deflate((g) => g.url).first(),
        page_views: group.count(),
      };
    })
    .inflate()
    .orderByDescending((r) => r.page_views);

  return counts.setIndex("page_name");
};
interface elementObjectType {
  url: string[],
  rank: number[],
  is_exit: boolean[],
  is_entry: boolean[],
  is_unique_page: boolean[]
}
interface unnestType {
  url: string,
  rank: number,
  is_entry: boolean,
  is_exit: boolean,
  is_unique_page: boolean,
}
const unnest = (x: elementObjectType[]) => {
  var unnested: unnestType[];
  unnested = [];
  for (let i = 0; i < x.length; i++) {
    var elementObject: elementObjectType = x[i]
    elementObject["url"].map((x, i) => {
      unnested.push({
        url: x,
        rank: elementObject["rank"][i],
        is_entry: elementObject["is_entry"][i],
        is_exit: elementObject["is_exit"][i],
        is_unique_page: elementObject["is_unique_page"][i]

      });
    });
  }
  return unnested;
};

const analyzeSession = (dataframe: IDataFrame) => {
  const sessions = dataframe.where(row => row.type === "visit_content").orderBy(row => row.timestamp)
    .groupBy((row) => row.uvi)
    .select((group) => {
      return {
        url: group.toArray().map((x, index) => x.url),
        rank: group.toArray().map((x, index) => index),
        is_exit: group
          .toArray()
          .map((x, index) => index === group.toArray().length - 1),
        is_entry: group.toArray().map((x, index) => index === 0),
        is_unique_page: group
          .toArray()
          .map((x, index) => index === group.toArray().length - 1 && index === 0),
      };
    }).inflate()
  const uSessions = unnest(sessions.toArray());
  const uDf = new DataFrame(uSessions).groupBy(row => row.url)
    .select(group => {
      return {
        url: group.deflate(g => g.url).first(),
        median_rank: group.deflate(g => g.rank).median(),
        exit_rate: group.deflate(g => g.is_exit).average(),
        entry_rate: group.deflate(g => g.is_entry).average(),
        unique_page_rate: group.deflate(g => g.is_unique_page).average()
      }
    }).inflate()
  return uDf
};

// Actual analysis
const analyse = (dataset: IDataFrame): any => {
  const visits = getVisits(dataset);
  const uniqueViews = DataFrame.concat(visits.toArray());

  const idxUniqueViews = uniqueViews.withIndex(
    Array.from(Array(uniqueViews.count()).keys())
  );
  const filteredVisitViews = idxUniqueViews.where(noError)
  const cleanedViews = filteredVisitViews.transformSeries({
    url: (u) => urlToPath(removeAnchor(u)),
  });
  const uniqueUrls = countURLs(cleanedViews);

  const augmentedDf = uniqueUrls.generateSeries({
    feedback_difference: row => row.feed_positive - row.feed_negative,
    feedback_ratio: row => row.feed_negative + row.feed_negative > 0 ? row.feed_positive / (row.feed_negative + row.feed_positive) : 0,
    pageType: row => getPageType(row.page_name),
    select_related_ratio: row => (row.select_related_out_nb / row.page_views),

  });
  console.log("ANALYZE SESSIONS")

  const sessionDf = analyzeSession(cleanedViews);
  console.log(sessionDf.toArray().length)
  console.log("JOIN...")
  console.log(augmentedDf.toArray().length)
  const resultDf = augmentedDf.join(
    sessionDf,
    (left) => left.page_name,
    (right) => right.url,
    (left, right) => {
      return {
        ...left,
        ...right
      };
    }
  )
  return resultDf.toArray();
};

export { analyse };
