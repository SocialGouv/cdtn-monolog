#!/bin/bash

SCRIPTS=`pwd`/scripts
DATA=`pwd`/data

# first we push the Matomo dump to Auzre
docker run -e AZ_STORAGE_TOKEN=$AZ_STORAGE_TOKEN -v $SCRIPTS:/scripts  mcr.microsoft.com/azure-cli bash /scripts/dump-matomo-yesterday.sh

# then we download it from Azure (we want to make sure everyting in ES come from Azure backups)
docker run -e AZ_STORAGE_TOKEN=$AZ_STORAGE_TOKEN -v $SCRIPTS:/scripts -v $DATA:/data --rm mcr.microsoft.com/azure-cli bash /scripts/download-dump.sh

# finally we convert and send to Elastic
docker run -e ELASTICSEARCH_URL=$ELASTICSEARCH_URL -e API_KEY=$API_KEY -v $DATA:/data/ --rm cdtn-monolog node -r esm src/ingester.js

rm data/*
