# Mise à jour des rapports dans Kibana

Les logs sont copiés de matomo vers ES de Kibana par une [github action](https://github.com/SocialGouv/cdtn-monolog/actions/workflows/schedule.yaml) dans l'index `log-new`

Si on doit re-run les reports, il faut cleaner dans Kibana ceux déjà générés, pour ceux où on ne clean pas dans le script `runMonthly`.
Par exemple ["logs-satisfaction"](./src/commands.ts).
À noter qu'il n'y a pas besoin de cleaner "log_reports" parce que le script fait un resetReportIndex juste avant de le sauver.
Pour cleaner, dans Kibana > Dev Tools
On check les logs pour le dernier mois. Si pas de données rien a cleaner.
```bash
GET logs-satisfaction/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "endDate": {
              "gte": "2023-01-01"
            }
          }
        }
      ]
    }
  }
}
```
S'il y a des données, on les supprime
```bash
POST logs-satisfactions/_delete_by_query
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "endDate": {
              "gte": "2023-01-01"
            }
          }
        }
      ]
    }
  }
}
```
Il faut cleaner les logs des index :
  - `logs-satisfactions`
  - `logs-satisfaction-reasons`
  - `log_reports_monthly`
  - `log_kpi_index`
