import * as dataForge from "data-forge";
import * as datasetUtil from "../dataset";
import * as util from "../util";

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
const filterNas = array => array.filter(a => a != null);
const add = (a, b) => a + b;

const sumFilter = array => {
  const filteredArray = filterNas(array);
  return filteredArray.reduce(add);
};
const avg = array => {
    const sum = array.reduce((previous, current) => (current += previous));
    return sum / array.length;
  };
const isLongVisit = (x) => {
    if(x.type == "visit_content") {
        return x.count > 2
    }else{
        return false
    };
};

const getUserType = (visitCount) => {
    const longvisits = visitCount.map(x => isLongVisit(x))
    return (sumFilter(longvisits))

}
const analyse = (dataset, reportId) => {
    const visits = datasetUtil.getVisits(dataset) //series of dataframes
    //console.log(visits.toArray()[30].toArray()) 
    const seriesOfVisits = visits.toArray()
    // clean urls
    const cleanSeriesOfVisits = seriesOfVisits.map(x => x.transformSeries({
        url: (u) => util.urlToPath(removeQuery(removeAnchor(u))),
    }))
    // deduplicates urls within user session (reloads)

    //console.log(uniqueSeriesOfVisits[30].toArray())
    const uniqueSeriesOfVisits = cleanSeriesOfVisits.map(x => x.distinct(x => x.url))
    // count visits by type of events (give a list of dict [{'type':visit_content, 'count': 2}, {}])
    const visitsTypesCount = uniqueSeriesOfVisits.map(visit => typeCounts(visit))
    const longVisitNb = visitsTypesCount.map(x => getUserType(x.toArray()))


    const LongVisitRatio = avg(longVisitNb)
    //console.log(visitsTypesCount[0])
    console.log()

    return dataset
}


export { analyse, reportType };
