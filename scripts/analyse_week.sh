#!/bin/bash

docker run -e ELASTICSEARCH_URL=$ELASTICSEARCH_URL -e API_KEY=$API_KEY --rm cdtn-monolog node -r esm src/cli.js --ingest