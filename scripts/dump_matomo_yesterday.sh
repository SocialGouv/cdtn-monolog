#!/bin/bash
#date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`
# date=`gdate -d "@$(($(gdate +%s) - 86400))"  "+%Y-%m-%d"` # to run locally on macosx
date=2021-11-02
limit=100
offset=0
accu="[]"

finished=false

prefix=$date-part

echo "Download Matomo content for $date"

# while not [], update offset and download next batch
while [ "$finished" = false ]; do

  url="https://matomo.fabrique.social.gouv.fr/index.php?module=API&method=Live.getLastVisitsDetails&idSite=4&period=day&date=$date&format=JSON&token_auth=anonymous&filter_limit=$limit&filter_offset=$offset"

  out=$prefix-$offset.json

  res=$(curl --silent $url)
  
  offset=$((offset + limit))

  if [ "$res" = "[]" ]; then
    finished=true
  else
    echo $res > $out
    echo "Offset : " $offset
  fi

done

echo "Assemble log files"

name=matomo-dump-$date
file=$name.json

jq -c -s '[.[][]]' $prefix*.json > $file

rm $prefix*.json

echo "Push file to Azure"
az storage blob upload \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container logs \
  --file $file \
  --name $name

rm $file
