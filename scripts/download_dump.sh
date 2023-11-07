#!/bin/bash

# Exit on error
set -e

mkdir data

date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`
#date=2021-05-08

az storage blob download \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container logs \
  --name matomo-dump-$date \
  --file data/$date.json
