# Code du travail numérique : Monolog

> Tooling for CDTN log management : storage, analysis, interpretation. The reports produced by Monolog can be reused in order to drive some of the CDTN features (suggestions, relations between documents...).

## Usage

Monolog can be used as a docker image to run log ingestion and log analysis, or as a JS library for accessing the log reports.
Logs are structured as a list of typed _actions_ describing user behaviour during a _visit_.

### ENV variable

As this project lies between different services, it is useful to understand the different environment variables :

```
MATOMO_URL # URL of the Matomo server where raw logs can be found
ELASTICSEARCH_URL # URL of the Elastic instance where the logs are stored eventually
ELASTIC_TOKEN # Token to use the Elastic API, read-only token is enough for the query lib
CDTN_API_URL # URL of the CDTN API required to generate a cache of the search engine results (without the api and final /)
```

## Local

To run locally launch ES :

    docker-compose up

NB: to run any command on your local environment, you won't need any API_KEY in next commands.

However you may need to create manually all elastic indices which can be achieved by using testAndCreateIndex(index, mappingIndex) method and replacing index by the index you want to create and mappingIndex by the mapping associated with the index.

## Log storage

### `ingest`

The `ingest` task takes a Matomo dump file in `data/`, convert it, and push the actions to Elastic.

```console
ELASTICSEARCH_URL=xxxx API_KEY=yyyy yarn monolog ingest data/
```

To test locally we can use the file [2020-04-24.json](./src/__tests__/__fixtures__/2020-04-24.json). It needs to be isolated in a folder (e.g. /src/**tests**/**fixtures**/data/2020-04-24.json) to then run

```console
yarn monolog ingest src/__tests__/input/data/
```

You can then run for example :

```console
node -r ts-node/register src/tests/query_es.ts
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
ELASTICSEARCH_URL=xxxx API_KEY=yyyy CDTN_API_URL=zzzz yarn monolog retrieve -o data.csv
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
- _KPI reports_ create kpi for tools, as the completion rate. Each month, we compute kpis for the last month.

```console
ELASTICSEARCH_URL=xxxx API_KEY=yyyy yarn monolog monthly -m mmmmmm
```

_mmmmmm_ being the suffix of folder _data-mmmmmm_, _data-outils-mmmmmm_ and _cache-mmmmmm.json_

### `query reports`

Using user searches and selections in conjonction with CDTN API search results, we can compute scores for each query cluster.
It allows us to identify query that are underperforming (the user do not select any results, or the users always select the 4th result rather than the first one...).
We also use the suggestion list used by the CDTN API in order to track if a query was suggested (query auto-completion) to the user.
Query reports are stored in Elastic.

```console
ELASTICSEARCH_URL=xxxx API_KEY=yyyy yarn monolog queries -d data.csv -c cache.json -s suggestions.txt
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

Most analysis are indexed in ElasticSearch and visualized via Kibana Dashboards

## saved objects

To restore Dashboards & visualisations follow this [documentation](https://www.elastic.co/guide/en/kibana/current/managing-saved-objects.html)
kibana dashboard are stored in the [kibana folder](./kibana/saved_objects/)

## Adding a new analysis

TODO : describe how to create an additional report

## Steps to populate kibana data (run each month)

### Check data

Check all days has events (<a href="https://cdtn-logs-kibana.fabrique.social.gouv.fr/app/dashboards#/view/ff3db4e0-799a-11ea-bd6b-db5304326dd3?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-31d%2Fd,to:now))">you can use this graph</a>)

If one day missing data, you can run the ingester for these days with [this github action](https://github.com/SocialGouv/cdtn-monolog/actions/workflows/schedule_day.yml).

If one day has duplicated data, you can run the followin ES queries to remove all data then re-run the ingester with [this github action](https://github.com/SocialGouv/cdtn-monolog/actions/workflows/schedule_day.yml).

```elasticsearch
# Etape 1 : Vérifier les données qui seront supprimé (ici la journée du 1er Mars 2023)
GET logs-new/_search
{
  "query": {
		"term": {
			"logfile": {
				"value": "2023-03-01"
			}
		}
	}
}

# Etape 2 : supprimer les données dans l'index
POST logs-new/_delete_by_query
{
  "query": {
		"term": {
			"logfile": {
				"value": "2023-03-01"
			}
		}
	}
}
```

### Start a frontend locally with an API

You need to run the frontend locally to expose the search API.
First, clone the frontend project: https://github.com/SocialGouv/code-du-travail-numerique

Duplicate the file `/packages/code-du-travail-frontend/pages/api/enterprises.ts` to `/packages/code-du-travail-frontend/pages/api/search.ts`

and change the `EnterprisesController` in the file by `SearchController`. The file should contain:

```ts
import { NextApiRequest, NextApiResponse } from "next";
import { runMiddleware, SearchController } from "../../src/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res);
  const controller = new SearchController(req, res);
  if (req.method === "GET") {
    controller.get();
  }
}
```

The run the project plugged to the preprod database :

https://github.com/SocialGouv/code-du-travail-numerique?tab=readme-ov-file#code-du-travail-frontend

### Monthly scripts

```sh
ELASTICSEARCH_URL=xxx API_KEY=yyy CDTN_API_URL=http://localhost:3000 yarn monolog retrieve -o november # pour génerer des csv des 3 derniers mois ~ 10min
CDTN_API_URL=http://localhost:3000 yarn monolog cache -d data-november -o cache-november.json # convertir les logs dans un json ~ 1h40
ELASTICSEARCH_URL=xxx API_KEY=yyy CDTN_API_URL=http://localhost:3000 yarn monolog monthly -m november # génerer les rapports mensuels ~ 1h20
ELASTICSEARCH_URL=xxx API_KEY=yyy CDTN_API_URL=http://localhost:3000 yarn monolog monthly-kpi -m november # génerer les KPIs mensuels ~ 17min
```

### Troubleshooting

#### A script has failed

A lancer pour clean les index ES et éviter les données dupliquées.

Par exemple, on a pas besoin de cleaner "log_reports" parce que le script fait un `resetReportIndex` juste avant de le sauver.

Dans Kibana > Dev Tools

- `logs-satisfaction`
- `logs-satisfaction-reasons`
- `log_reports_monthly`
- `log_kpi_index`

Ci-dessous, un example pour supprimer les données de janvier 2023

#### Pour `logs-satisfaction` et `logs-satisfaction-reasons`

```elasticsearch
GET logs-satisfaction/_search
{
  "query": {
    "bool": {
      "must": [
        {"range": {
          "endDate": {
            "gte": "2023-01-01",
            "lt": "2023-02-01"
          }
        }}
      ]
    }
  }
}

POST logs-satisfaction/_delete_by_query
{
  "query": {
    "bool": {
      "must": [
        {"range": {
          "endDate": {
            "gte": "2023-01-01",
            "lt": "2023-02-01"
          }
        }}
      ]
    }
  }
}
```

#### Pour `log_reports_monthly`

```elasticsearch
GET log_reports_monthly/_search
{
  "query": {
    "term": {
      "reportId.keyword": "monthly-1-2023"
    }
  }
}

# Etape 2 : supprimer l'index
POST log_reports_monthly/_delete_by_query
{
  "query": {
    "term": {
      "reportId.keyword": {
        "value": "monthly-1-2023"
      }
    }
  }
}
```

#### Pour `log_kpi_index`

```elasticsearch
GET log_kpi_index/_search
{
  "query": {
    "bool": {
      "must": [
        {"range": {
          "start_date": {
            "gte": "2023-01-01",
            "lt": "2023-02-01"
          }
        }}
      ]
    }
  }
}

POST log_kpi_index/_delete_by_query
{
  "query": {
    "bool": {
      "must": [
        {"range": {
          "start_date": {
            "gte": "2023-01-01",
            "lt": "2023-02-01"
          }
        }}
      ]
    }
  }
}
```
