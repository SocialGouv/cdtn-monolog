import * as datasetUtil from "../dataset";
import * as util from "../util";

const reportType = "metrics";

const removeAnchor = (url) => {
    return url.split("#")[0];
  };

const removeQuery = (url) => {
    return url.split("?q=")[0];
};

const add = (a, b) => a + b;
const avg = array => {
    const sum = array.reduce((previous, current) => (current += previous));
    return sum / array.length;
  };

const valueCounts = arr => {
    var counts = {};
  
    for (var i = 0; i < arr.length; i++) {
      var num = arr[i];
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    return counts;
  };

const typeCounts = (visit) => {
    return visit.groupBy(row => row.type).select(group => {
        return {
            type: group.first().type,
            count: group.count(),
            referrerTypeName: group.first().referrerTypeName

        };
    })
};

const isExploVisit = (x) => {
    // if more than 2 contents visited --> explo
    // else: if search or themes used --> explo
    if(x.type == "visit_content") {
        return x.count > 2 ? true : false
    }else{
        const exploTypes = Array("search", "themes", "selectRelated")
        if (exploTypes.includes(x.type)){
            return true
        }else{
            return false
        }
    }
};

const isRedirected = (x) => {
    // if a user comes from a search engine and select related return true
    if (x.referrerTypeName == "Search Engines" && x.type == "selectRelated"){
        return true
    }else{
        return false
    }
}
const hasSelectedRelated = (x) => {

    return x.type == "selectRelated" ? true : false
}
const countSelectRelated = (x) => {

    return x.type == "selectRelated" ? x.count : 0
}
const getSelectRelated = (relatedCount) => {
    // takes an array with true if eventType selectRelated else false
    // returns two metric per session: 
    // visitorSelectedRelated true if the user clicked at least one on selectRelated
    // SelectRelatedCount: the nb of times the user selected related contents

    return {
        "visitorSelectedRelated": relatedCount.some(hasSelectedRelated),
        "selectRelatedCount" : relatedCount.map(x => countSelectRelated(x)).reduce(add),
        "visitorWasRedirected" : relatedCount.some(isRedirected)
    }

}
const getUserType = (visitCount) => {
    // based on visit counts [{'type':visit_content, 'count': 2}]
    //determine whether its long or short visits removing nas
    return visitCount.some(isExploVisit)

}
const clean = (visits) => {
    const seriesOfVisits = visits.toArray()
    // remove sections and remove queries from urls
    const cleanSeriesOfVisits = seriesOfVisits.map(x => x.transformSeries({
        url: (u) => util.urlToPath(removeQuery(removeAnchor(u))),
    }))
    // deduplicates urls within user session (reloads)
    const uniqueSeriesOfVisits = cleanSeriesOfVisits.map(x => x.distinct(x => {x.url, x.type}))
    return uniqueSeriesOfVisits.map(visit => typeCounts(visit).toArray())
}
const analyse = (dataset, reportId) => {

    const visits = datasetUtil.getVisits(dataset) //series of dataframes

    // CLEANING

    // count visits by type of events (give a list of dict [{'type':visit_content, 'count': 2}, {}])
    const visitsTypesArray = clean(visits)

    // ANALYSIS
    const nbVisitsAnalyzed = visitsTypesArray.length

    // SelectRelated
    const selectRelatedStats = visitsTypesArray.map(x => getSelectRelated(x))

    const visitorSelectedRelated = selectRelatedStats.map(x => x["visitorSelectedRelated"])
    const SelectRelatedCount = selectRelatedStats.map(x => x["selectRelatedCount"])
    const visitorWasRedirected = selectRelatedStats.map(x => x["visitorWasRedirected"])
    
    //visitorTypes
    const isLongVisitArray = visitsTypesArray.map(x => getUserType(x)) // return false true array if user is long
    const LongVisitRatio = avg(isLongVisitArray) // simple average of the visitcount array
    const visitsTypesCount = valueCounts(isLongVisitArray)

    const metricsAnalysis = {
        "nbVisitsAnalyzed" : nbVisitsAnalyzed,
        "longVisitsRatio" : LongVisitRatio,
        "longVisitsNb": visitsTypesCount[false],
        "shortVisitsNb" : visitsTypesCount[true],
        "visitorSelectedRelatedRatio" : avg(visitorSelectedRelated),
        "SelectRelatedCount" : SelectRelatedCount.reduce(add),
        "visitorWasRedirected": visitorWasRedirected.reduce(add),
        "reportId": reportId,
    }
    return Array(metricsAnalysis)
}

export { analyse, reportType, removeAnchor, removeQuery, add, avg,
    valueCounts, typeCounts , isExploVisit, isRedirected, hasSelectedRelated,
    countSelectRelated, getSelectRelated, getUserType, clean};
