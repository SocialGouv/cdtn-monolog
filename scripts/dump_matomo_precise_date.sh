#!/bin/bash

# Exit on error
set -e

if ! command -v curl &> /dev/null
then
    echo "curl could not be found, install it"
    apk add curl
fi

limit=100
offset=0
accu="[]"
date=$1

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
    echo $res >$out
    echo "Offset : " $offset
  fi

done

echo "Assemble log files"

name=matomo-dump-$date
file=$name.json

jq -c -s '[.[][]]' $prefix*.json >$file

rm $prefix*.json
