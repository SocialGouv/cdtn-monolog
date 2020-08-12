## Metrics:
---
Different metrics are computed to collect insights on the website usage and generate report in the following format:

```r
metricsAnalysis = {
        "nbVisitsAnalyzed" : number of user sessions analyzed on the given oeriod,
        "longVisitsNb": Number of Long visits defined as:
         - either user visits more than 2 "visit_content" pages
         - or uses one of the "Search", "Themes", "selectRelated" features in their session.
        "longVisitsRatio" : LongVisitsNb/nbVisitsAnalyzed, 
        "shortVisitsNb" : should be equal to nbVisitsAnalyzed - LongVisitsNb, 

        "SelectRelatedCount" : nb of users whose session includes the selectRelated feature,
        "visitorSelectedRelatedRatio" : SelectRelatedCount/nbVisitsAnalyzed.
        "visitorWasRedirected": nb of users whose session includes the selectRelated feature AND came on the website via a search engine.
        "reportId": id of the report based on Date,
    }
```