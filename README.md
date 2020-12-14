# Code du travail numérique : Monolog

> Tooling for CDTN log management : storage, analysis, interpretation. The reports produced by Monolog can be reused in order to drive some of the CDTN features (suggestions, relations between documents...).

## Usage

Monolog can be used as a docker image to run log ingestion and log analysis, or as a JS library for accessing the log reports.
Logs are structured as a list of typed _actions_ describing user behaviour during a _visit_.

### ENV variable

As this project lies between different services, it is useful to understand the different environment variables :

```
MATOMO_URL # URL of the Matomo server where raw logs can be found
AZ_STORAGE_TOKEN # Azure token to push dump to Azure blob
ELASTIC_URL # URL of the Elastic instance where the logs are stored eventually
ELASTIC_TOKEN # Token to use the Elastic API, read-only token is enough for the query lib
CDTN_API_URL # URL of the CDTN API required to generate a cache of the search engine results
```

## Log storage

### Backup

We use Azure blob to store daily dumps of the Matomo content. Downloading the data from Matomo and pushing it to Azure is done through a bash script `download-dump.sh` executed from the Azure Docker image.

### Ingestion

The `ingest` task takes a Matomo dump file, convert it, and push the actions to Elastic.

```console
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy AZURE_TOKEN=xxxx yarn monolog ingest
```

### Script

These two steps can be found in the bash script `log-backup.sh`, which relies on Docker commands. It's called daily as a cron job.

## Analysis

The `monthly` task run an analysis using logs for the last three months.

It's done in several steps :

- first we `retrieve` logs for the last 3 month
- then we build the corresponding `cache` using the CDTN API
- finally we execute the `monthly` analysis using both
- we can also generate the `queries` reports using the same 3 months data

The `log reports` are stored in Elastic and can then be shown in Kibana dashboards.

### `retrieve`

Retrieve logs for the last 3 months and store them in the output as a CSV file.
We only select _some_ action types : searches / selections / content visits / feebdack.

```console
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy yarn monolog retrieve -o data.csv
```

### `cache`

We identify all _searches_ in the data CSV file, and trigger them to the CDTN API search endpoint.
We store the results for those queries in a cache json file that'll be used in the next steps to compute popularity metrics and generate the query reports.

```console
CDTN_API_URL=zzzz yarn monolog cache -d data.csv -o cache.json
```

### `monthly`

Based on usage logs we compute several reports and store them to Elastic :

- _Monthly report_ contains metrics for the last month : average daily visits, number of unique visits...
- _Popularity reports_ describe the most popular contents, conventions collectives and queries. We compute popularity for each of the last three months in order to observe their progression. (Note: queries are grouped in clusters, if the trigger the same results from the API, we consider them as part of the same _query cluster_)

```console
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy yarn monolog monthly -d data.csv -c cache.json
```

### `query reports`

Using user searches and selections in conjonction with CDTN API search results, we can compute scores for each query cluster.
It allows us to identify query that are underperforming (the user do not select any results, or the users always select the 4th result rather than the first one...).
We also use the suggestion list used by the CDTN API in order to track if a query was suggested (query auto-completion) to the user.
Query reports are stored in Elastic.

```console
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy yarn monolog queries -d data.csv -c cache.json -s suggestions.txt
```

## Covisits

The `covisits` task check for links between documents that can be found in the user journeys.
If several visits contain the same content views, we use it as a signal for content recommandations.
We store those links in the Elastic log reports.

The CDTN API will then read those links at build time, and use them to provide the user with "related content" suggestions.

To refresh the covisits using a CSV data export (see `retrieve` above) :

```console
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy yarn monolog covisits -d data.csv
```

## Elastic Reports

Analysis reports are stored in different indices :

- the `log_reports` index contains up-to-date reports that are overriden at each exection, there can be queried using the `reportType` attribute :
  - `covisit` : covisit reports
  - `content-popularity` / `convention-popularity` / `query-popularity` : popularity reports for the current month
- `log_reports_monthly` index containing a monthly report for each month
- `log_reports_queries` index containing the last query reports (overriden at each analysis)

> Report types can be found in `/src/analysis/reports.ts`

# TODO :

## Query lib

In order to reuse log reports, we also provide a query component to access them.
In the context of the CDTN data management, the reports can be directly incorporated within the data to improve different services.

```
import { Queries } from "@socialgouv/cdtn-monolog";
import { Client } from "@elastic/elasticsearch";

const node = "http://localhost:9200";

const esClient = new Client({ node });

const queries = new Queries(esClient, "monolog-reports");

const testContent = "fiche-service-public/teletravail-dans-le-secteur-prive";

queries
  .getCovisitLinks(testContent)
  .then((s) => console.log(JSON.stringify(s, null, 2)))
  .catch((err) => console.log(err));
```

## Kibana

TODO : we'll add some Kibana configuration to visualize log reports and provide business insights.

## Adding a new analysis

TODO : describe how to create an additional report
