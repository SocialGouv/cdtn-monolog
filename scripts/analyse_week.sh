#!/bin/bash

docker run -e ELASTICSEARCH_URL=$ELASTICSEARCH_URL -e API_KEY=$API_KEY -e MONOLOG_ACTION=analyse --rm cdtn-monolog node -r esm src/monolog.js