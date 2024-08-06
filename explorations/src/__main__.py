import pandas as pd
import sys
import os
from dotenv import load_dotenv
from src.elasticsearch_connector import ElasticsearchConnector
from tqdm import tqdm

load_dotenv()


def main() -> int:
    es_connector = ElasticsearchConnector(env='monolog')

    ELASTIC_QUERY = {
      "query": {
        "bool": {
          "must": [
            {
              "range": {
               "logfile": {
                  "gte": "2023-03-01",
                  "lt": "2023-04-01"
               }
              }
            }
          ]
        }
      }
    }
    logs = es_connector.execute_query(ELASTIC_QUERY, "logs-new")
    print(f'Les données du mois de mars représentent {round(logs.memory_usage(index=True).sum()/1024/1024, 2)} Mo')
    print(f'Il y a {logs.shape} (lignes, colonnes)')
    print(f'Nombre de visites uniques (idVisit) {logs.idVisit.nunique()}')
    print(f'Nombre de visites uniques (uvi) {logs.uvi.nunique()}')
    column_to_retrieve = [
      'timestamp', 'url', 'idVisit', 'referrerName', 'referrerTypeName', 'logfile', 'type', 'outil', 'outilAction',
      'outilEvent', 'ccAction', 'cc', 'idCc', 'feedbackType', 'visited'
    ]
    print(
      f'En sélectionnant les colonnes {column_to_retrieve} on tombe à : {logs[column_to_retrieve].memory_usage(index=True).sum()/1024/1024} Mo'
    )
    return 0

if __name__ == '__main__':
    sys.exit(main())
