# Code du travail numérique : Monolog

> Tooling for CDTN log management : storage, analysis, interpretation. The reports produced by Monolog can be reused in order to drive some of the CDTN features (suggestions, relations between documents...).

## Usage

Monolog can be used as a docker image to run log ingestion and log analysis, or as a JS library for accessing the log reports.
Logs are structured as a list of typed _actions_ describing user behaviour during a _visit_.

### ENV variable

As this project lies between different services, it can be useful to describe the different environment variable :

```
MATOMO_URL # URL of the Matomo server where raw logs can be found
AZ_STORAGE_TOKEN # Azure token to push dump to Azure blob
ELASTIC_URL # URL of the Elastic instance where the logs are stored eventually
ELASTIC_TOKEN # Token to use the Elastic API, read-only token is enough for the query lib
```

## Log storage

### Backup

We use Azure blob to store daily dumps of the Matomo content. Downloading the data from Matomo and pushing it to Azure is done through a bash script `download-dump.sh` executed from the Azure Docker image.

### Ingestion

The `ingest` task takes a Matomo dump file, convert it, and push the actions to Elastic.

```
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy AZURE_TOKEN=xxxx yarn run monolog --ingest
```

### Script

These two steps can be found in the bash script `log-backup.sh`, which relies on Docker commands. It's called daily as a cron job.

## Analysis

The default `analyse` task run the standard analysis using logs of the last 30 days :

- suggestions : store the list of suggestions along with their respective weights (computed from frequency in the logs)
- covisit : for each matching document, store the list of their identified links (using visits similarity)
- popularity : store the list of most significant changes in content popularity (up or down)

Analysis results are stored in Elastic Search and available for Kibana visualisation or directly from code using the query lib described below.

```
ELASTIC_URL=xxxx ELASTIC_API_TOKEN=yyyy yarn run monolog --analyse
```

By default this task is performed on a weekly basis using the `run-analysis.sh` script as a cron job.

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
