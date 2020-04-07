#!/bin/bash

date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`
#date=2020-03-30

az storage blob download \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container logs \
  --name matomo-dump-$date \
  --file /data/$date.json
