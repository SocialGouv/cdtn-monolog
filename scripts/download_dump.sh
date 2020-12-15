#!/bin/bash

mkdir data

date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`
#date=2020-09-30

az storage blob download \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container logs \
  --name matomo-dump-$date \
  --file data/$date.json
