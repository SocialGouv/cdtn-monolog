import pandas as pd
import math
from tqdm.notebook import tqdm
from typing import List, Dict
from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv
load_dotenv()

# TODO : n'oublier pas de créer un .env
ES_HOST = os.getenv('ELASTICSEARCH_MONOLOG_HOST')
es = Elasticsearch(
    [ES_HOST], 
    http_auth=(
        os.getenv('ELASTICSEARCH_MONOLOG_USER'), os.getenv('ELASTICSEARCH_MONOLOG_PASSWORD')
    ), 
    timeout=36600
)

print(f'connection established with ElasticSearch {es.ping()}')


def init_query(query=None):
    search_body = {
       "query":{
          "range":{
             "lastActionDateTime":{
                "gte":"2022-01-01 00:00:00",
                "lt":"2022-02-01 00:00:00"
             }
          }
       }
    } if query==None else query
    resp = es.search(
            index = "logs-new",
            body = search_body,
            scroll = '100m', # time value for search
            size=10000,
        )
    scroll_id = resp["_scroll_id"]
    num_hits = resp["hits"]["total"]["value"]
    return scroll_id, num_hits


def scroll_query(scroll_id):
    resp = es.scroll(
        scroll_id = scroll_id,
        scroll="10m",
    )
    return resp["hits"]["hits"]


def execute_query(query=None):
    scroll_id, num_hits = init_query(query)
    step_size = 10_000
    data = []
    with tqdm(total=num_hits) as pbar:
        for i in range(math.ceil(num_hits/step_size)):
            data.extend(scroll_query(scroll_id))
            # voir comment sauvegarder au fur et a mesure
            pbar.update(step_size)
    
    logs_new = pd.DataFrame([d['_source'] for d in data])
    return logs_new


def load_file_if_exists_or_execute_query(filename='logs_new_from_apr_21_to_dec_21.csv', query=None):
    try:
        return pd.read_csv(filename)
    except:
        return execute_query(query)
