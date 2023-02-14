// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DataFrame, IDataFrame } from "data-forge";
import { parseISO } from "date-fns";

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

const sameMonth = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
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
        feed_nb: group.where((row) => ["positive", "negative"].includes(row.feedbackType)).count(),
        feed_negative: group.where((row) => row.feedbackType == "negative").count(),
        feed_positive: group.where((row) => row.feedbackType == "positive").count(),
        median_time_spent: group
          .deflate((g) => g.timeSpent)
          .where((x) => x !== undefined)
          .median(),
        page_name: group.deflate((g) => g.url).first(),
        page_views: group.count(),
        select_related_out_nb: group.where((row) => row.type == "select_related").count(),
      };
    })
    .inflate()
    .orderByDescending((r) => r.page_views);

  return counts.setIndex("page_name");
};
/* eslint-disable */
class DefaultDict {
  constructor(defaultInit) {
    return new Proxy(
      {},
      {
        get: (target, name) =>
          name in target
            ? target[name]
            : (target[name] =
              typeof defaultInit === "function"
                ? new defaultInit().valueOf()
                : defaultInit),
      }
    );
  }
}
class tupleList {
  comments: Array<string> = [];
  reasons: Array<string> = [];
}
// custom groupby to get arrays of feedbacks
/* eslint-enable */
const custGroupBy = (x: Array<string>) => {
  /* eslint no-var: off */
  const defarray = new DefaultDict(tupleList);
  for (let i = 0; i < x.length; i++) {
    var elementObject = x[i];
    if (elementObject["type"] == "feedback_suggestion") {
      defarray[elementObject["url"]].reasons.push(elementObject["feedbackType"]);
    } else if (elementObject["type"] == "feedback_category") {
      defarray[elementObject["url"]].comments.push(elementObject["feedbackType"]);
    }
  }
  return defarray;
};

interface elementObjectType {
  url: string[];
  rank: number[];
  is_exit: boolean[];
  is_entry: boolean[];
  is_unique_page: boolean[];
}
interface unnestType {
  url: string;
  rank: number;
  is_entry: boolean;
  is_exit: boolean;
  is_unique_page: boolean;
}
const unnest = (x: elementObjectType[]) => {
  /* eslint no-var: off */
  const unnested: unnestType[] = [];
  for (let i = 0; i < x.length; i++) {
    var elementObject: elementObjectType = x[i];
    elementObject["url"].map((x, i) => {
      unnested.push({
        is_entry: elementObject["is_entry"][i],
        is_exit: elementObject["is_exit"][i],
        is_unique_page: elementObject["is_unique_page"][i],
        rank: elementObject["rank"][i],
        url: x,
      });
    });
  }
  return unnested;
};

const analyzeSession = (dataframe: IDataFrame) => {
  const sessions = dataframe
    .where((row) => row.type === "visit_content")
    .orderBy((row) => row.timestamp)
    .groupBy((row) => row.uvi)
    .select((group) => {
      return {
        is_entry: group.toArray().map((x, index) => index === 0),
        is_exit: group.toArray().map((x, index) => index === group.toArray().length - 1),
        is_unique_page: group.toArray().map((x, index) => index === group.toArray().length - 1 && index === 0),
        rank: group.toArray().map((x, index) => index),
        url: group.toArray().map((x, index) => x.url),
      };
    })
    .inflate();
  const uSessions = unnest(sessions.toArray());
  const uDf = new DataFrame(uSessions)
    .groupBy((row) => row.url)
    .select((group) => {
      return {
        entry_rate: group.deflate((g) => g.is_entry).average(),
        exit_rate: group.deflate((g) => g.is_exit).average(),
        median_rank: group.deflate((g) => g.rank).median(),
        unique_page_rate: group.deflate((g) => g.is_unique_page).average(),
        url: group.deflate((g) => g.url).first(),
      };
    })
    .inflate();
  return uDf;
};

const flatDocs = (resultArrayFeed: Array<Any>) => {
  var res2 = [];
  for (const feedObject of resultArrayFeed) {
    if (typeof feedObject.suggestions !== "undefined") {
      for (const suggestion of feedObject.suggestions) {
        res2.push({
          endDate: feedObject.endDate,
          pageType: feedObject.pageType,
          page_name: feedObject.page_name,
          reason: suggestion,
          url: feedObject.url,
        });
      }
    }
  }
  return res2;
};

// Actual analysis
const analyse = (dataset: IDataFrame): any => {
  // filter dataset on last month
  const today = new Date();
  const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

  const newIndex = Array.from(Array(dataset.count()).keys());
  const datasetThisMonth = dataset
    .withIndex(newIndex)
    .withSeries({
      lastActionDateTime: (df) => df.deflate((row) => row.lastActionDateTime).select((value) => parseISO(value)),
    })
    .where((row) => sameMonth(row.lastActionDateTime, lastMonth));
  const maxDate = new Date(datasetThisMonth.getSeries("lastActionDateTime").max());

  // get unique visits
  const visits = getVisits(datasetThisMonth);
  const uniqueViews = DataFrame.concat(visits.toArray());

  const idxUniqueViews = uniqueViews.withIndex(Array.from(Array(uniqueViews.count()).keys()));
  const filteredVisitViews = idxUniqueViews.where(noError);
  const cleanedViews = filteredVisitViews.transformSeries({
    url: (u) => urlToPath(removeAnchor(u)),
  });
  // filter only feedbacks
  const feedbacks = cleanedViews.where((row) => !["", "positive", "negative"].includes(row.feedbackType));
  const feedbacks_grouped = custGroupBy(feedbacks.toArray());
  const uniqueUrls = countURLs(cleanedViews);
  const augmentedDf = uniqueUrls.generateSeries({
    feedback_difference: (row) => row.feed_positive - row.feed_negative,
    feedback_ratio: (row) =>
      row.feed_negative + row.feed_negative > 0 ? row.feed_positive / (row.feed_negative + row.feed_positive) : 0,
    pageType: (row) => getPageType(row.page_name),
    select_related_ratio: (row) => row.select_related_out_nb / row.page_views,
  });
  console.log("ANALYZE SESSIONS");

  const sessionDf = analyzeSession(cleanedViews);
  console.log(sessionDf.toArray().length);
  console.log("JOIN SESSIONS WITH ADDITIONAL STATS...");
  console.log(augmentedDf.toArray().length);
  const resultDf = augmentedDf.join(
    sessionDf,
    (left) => left.page_name,
    (right) => right.url,
    (left, right) => {
      return {
        ...left,
        ...right,
      };
    }
  );
  console.log("ADDING FEEDBACKS Comments");
  // add endDate to df
  const resultDfDate = resultDf.withSeries({
    endDate: (df) => df.deflate((row) => row.count).select((count) => maxDate),
  });
  // add feedbacks arrays to result array
  const resultArray = resultDfDate.toArray();
  const resultArrayFeed = resultArray.map((obj) => ({
    ...obj,
    categories: feedbacks_grouped[obj.url].reasons,
    suggestions: feedbacks_grouped[obj.url].comments,
  }));

  console.log(resultArrayFeed);
  return { analysis: resultArrayFeed, reasons: flatDocs(resultArrayFeed) };
};

export { analyse };
