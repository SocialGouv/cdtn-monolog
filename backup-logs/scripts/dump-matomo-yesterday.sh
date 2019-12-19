#!/bin/bash

date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`

url="https://matomo.tools.factory.social.gouv.fr/index.php?module=API&method=Live.getLastVisitsDetails&idSite=4&period=day&date=$date&format=JSON&token_auth=anonymous&filter_limit=-1"

name=matomo-dump-$date
file=$name.json

echo "Download Matomo content for $date"
curl $url -o $file

echo "Push file to Azure"
az storage blob upload \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container data \
  --file $file \
  --name $name
