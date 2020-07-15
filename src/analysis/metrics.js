import * as dataForge from "data-forge";
import * as datasetUtil from "../dataset";
import * as util from "../util";
var fs = require('fs');

const reportType = "popularity";
const removeAnchor = (url) => {
    return url.split("#")[0];
  };

const removeQuery = (url) => {
    return url.split("?q=")[0];
};

const typeCounts = (visit) => {
    return visit.groupBy(row => row.type).select(group => {
        return {
            type: group.first().type,
            count: group.count()

        };
    })
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

const isExploVisit = (x) => {
    // if more than one contents visited --> explo
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
    };
};
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
        "SelectRelatedCount" : relatedCount.map(x => countSelectRelated(x)).reduce(add)
    }

}
const getUserType = (visitCount) => {
    // based on visit counts [{'type':visit_content, 'count': 2}]
    //determine whether its long or short visits removing nas
    return visitCount.some(isExploVisit)

}
const analyse = (dataset, reportId) => {

    const visits = datasetUtil.getVisits(dataset) //series of dataframes
    
    //console.log(visits.toArray()[32].toArray()) 
    const seriesOfVisits = visits.toArray()
    // clean urls
    const cleanSeriesOfVisits = seriesOfVisits.map(x => x.transformSeries({
        url: (u) => util.urlToPath(removeQuery(removeAnchor(u))),
    }))
    // deduplicates urls within user session (reloads)

    //console.log(cleanSeriesOfVisits[30].toArray())
    const uniqueSeriesOfVisits = cleanSeriesOfVisits.map(x => x.distinct(x => x.url))
    // count visits by type of events (give a list of dict [{'type':visit_content, 'count': 2}, {}])
    const visitsTypesArray = uniqueSeriesOfVisits.map(visit => typeCounts(visit).toArray())
    const nbVisitsAnalyzed = visitsTypesArray.length
    const res = visitsTypesArray
    const resjson = JSON.stringify(res)
    const callback = function(err) {
        if (err) throw err;
        console.log('complete');
        }
    fs.writeFile('myjsonfile.json', resjson, 'utf8', callback);


    const isLongVisitArray = visitsTypesArray.map(x => getUserType(x)) // return false true array if user is long

    const selectRelatedStats = visitsTypesArray.map(x => getSelectRelated(x))
    const visitorSelectedRelated = avg(selectRelatedStats.map(x => x["visitorSelectedRelated"]))
    const SelectRelatedCount = selectRelatedStats.map(x => x["SelectRelatedCount"])
    console.log(visitorSelectedRelated, SelectRelatedCount.reduce(add))

    const LongVisitRatio = avg(isLongVisitArray) // simple average of the visitcount array
    const visitsTypesCount = valueCounts(isLongVisitArray)

    //console.log(visitsTypesCount[0])
    const metricsAnalysis = {
        "nbVisitsAnalyzed" : nbVisitsAnalyzed,
        "longVisitsRatio" : LongVisitRatio,
        "longVisitsNb": visitsTypesCount[false],
        "shortVisitsNb" : visitsTypesCount[true],
        "visitorSelectedRelatedRatio" : avg(visitorSelectedRelated),
        "SelectRelatedCount" : SelectRelatedCount.reduce(add),
        "reportId": reportId,
    }
    console.log(metricsAnalysis)

    return dataset
}


export { analyse, reportType };
