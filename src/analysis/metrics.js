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

const analyse = (dataset, reportId) => {
    const visits = datasetUtil.getVisits(dataset)//series of dataframes
    //console.log(visits.toArray()[30].toArray()) 
    const seriesOfVisits = visits.toArray()
    // clean urls
    const cleanSeriesOfVisits = seriesOfVisits.map(x => x.transformSeries({
        url: (u) => util.urlToPath(removeQuery(removeAnchor(u))),
    }))
    // deduplicates urls within user session

    //console.log(uniqueSeriesOfVisits[30].toArray())
    const uniqueSeriesOfVisits = cleanSeriesOfVisits.map(x => x.distinct(x => x.url))
    console.log(uniqueSeriesOfVisits.map(visit => typeCounts(visit).toArray()))
    return dataset
}


export { analyse, reportType };
