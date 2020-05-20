#!/bin/bash

DIR=`pwd`
SCRIPTS=$DIR/scripts
DATA=$DIR/data

# first we push the Matomo dump to Auzre
docker run -e AZ_STORAGE_TOKEN=$AZ_STORAGE_TOKEN -v $SCRIPTS:/scripts --rm mcr.microsoft.com/azure-cli bash /scripts/dump_matomo_yesterday.sh

# then we download it from Azure (we want to make sure everyting in ES come from Azure backups)
docker run -e AZ_STORAGE_TOKEN=$AZ_STORAGE_TOKEN -v $SCRIPTS:/scripts -v $DATA:/data --rm mcr.microsoft.com/azure-cli bash /scripts/download_dump.sh

# finally we convert and send to Elastic
docker run -e ELASTICSEARCH_URL=$ELASTICSEARCH_URL -e API_KEY=$API_KEY -e MONOLOG_ACTION=ingest -v $DATA:/data/ --rm cdtn-monolog-v1

rm data/*
