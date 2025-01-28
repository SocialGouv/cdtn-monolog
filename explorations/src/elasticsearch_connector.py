import pandas as pd
#import time
#import json
import math
from tqdm.notebook import tqdm
from typing import List, Dict
from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv
import logging

load_dotenv()

class ElasticsearchConnector:
    def __init__(self, env='local'):
        #self.host = os.getenv('ELASTICSEARCH_HOST')
        #self.user = os.getenv('ELASTICSEARCH_USER')
        #self.password = os.getenv('ELASTICSEARCH_PASSWORD')
        if env=='local':
            self.overrides_env_es_local()
        elif env == 'monolog':
            self.overrides_env_es_monolog()
        elif env == 'admin':
            self.overrides_env_es_admin()
        elif env == 'admin-test':
            self.overrides_env_es_admin_test()
        else:
            raise Exception('Unexpected env', f'No environment corresponding to {env}')
        self.connection = self._get_connection()

    def overrides_env_es_monolog(self):
        self.host = os.getenv('ELASTICSEARCH_MONOLOG_HOST')
        self.api_key = os.getenv('ELASTICSEARCH_MONOLOG_API_KEY')

    def overrides_env_es_admin(self):
        self.host = os.getenv('ELASTICSEARCH_SEARCH_ENGINE_HOST')
        self.api_key = os.getenv('ELASTICSEARCH_SEARCH_ENGINE_API_KEY')

    def overrides_env_es_admin_test(self):
        self.host = os.getenv('ELASTICSEARCH_SEARCH_ENGINE_TEST_HOST')
        self.api_key = os.getenv('ELASTICSEARCH_SEARCH_ENGINE_TEST_API_KEY')

    def overrides_env_es_local(self):
        self.host = os.getenv('ELASTICSEARCH_LOCAL_HOST')
        self.api_key = os.getenv('ELASTICSEARCH_LOCAL_API_KEY')

    def _get_connection(self) -> Elasticsearch:
        """
        Establish a connection to Elasticsearch using API Key authentication.
        """
        es_connection = Elasticsearch(
            [self.host],
            api_key=self.api_key,
            timeout=36600
        )
        connection_success = '\x1b[92mestablished with success\x1b[0m' if es_connection.ping() else \
            '\x1B[1m\x1b[91mis KO\x1b[0m'
        print(f'Connection with Elasticsearch {connection_success}')
        return es_connection

    def count_hits(self, query: Dict, index: str) -> int:
        nb_hits = self.connection.count(
            index=index,
            body=query
        )
        return nb_hits['count']

    def _init_query(self, query: Dict, index: str) -> (str, List):
        resp = self.connection.search(
            index=index,
            body=query,
            scroll='1000m',  # time value for search
            size=10000,
        )
        scroll_id = resp['_scroll_id']
        hits = resp['hits']['hits']
        return scroll_id, hits

    def _scroll_query(self, scroll_id) -> List:
        resp = self.connection.scroll(
            scroll_id=scroll_id,
            scroll="10m",
        )
        return resp["hits"]["hits"]

    def execute_query_json(self, query: Dict, index: str):
        num_hits = self.count_hits(query, index)
        step_size = 10_000
        data = []
        with tqdm(total=num_hits) as pbar:
            scroll_id, hits = self._init_query(query, index)
            data.extend(hits)
            pbar.update(step_size)

            for i in range(math.floor(num_hits / step_size)):
                data.extend(self._scroll_query(scroll_id))
                pbar.update(step_size)
        return data

    def execute_query(self, query: Dict, index: str):
        num_hits = self.count_hits(query, index)
        step_size = 10_000
        data = []
        with tqdm(total=num_hits) as pbar:
            scroll_id, hits = self._init_query(query, index)
            data.extend(hits)
            pbar.update(step_size)

            for i in range(math.floor(num_hits / step_size)):
                data.extend(self._scroll_query(scroll_id))
                pbar.update(step_size)
        return pd.DataFrame([d['_source'] for d in data])  # Refacto en remplaçant data par execute_query_json
