#!/bin/bash
ALLDATES=""
for i in {0..37}
do
   #DATE=`date --date="$i days ago" "+%Y-%m-%d"`
   DATE=`date -v -${i}d "+%Y-%m-%d"`
   #ALLDATES="${ALLDATES} \"${DATE}\""
   ALLDATES="${ALLDATES}${DATE},"

   az storage blob download \
      --account-key "$AZ_STORAGE_TOKEN" \
      --account-name=cdtndata \
      --container logs \
      --name matomo-dump-$DATE \
      --file ~/tmp/reingestion/$DATE.json

done

echo "$ALLDATES"
