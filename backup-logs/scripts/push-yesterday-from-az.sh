#!/bin/bash
date=`date -d "@$(($(date +%s) - 86400))"  "+%Y-%m-%d"`
file=matomo-dump-$date.json 
az storage blob download --account-key "$AZ_STORAGE_TOKEN" --account-name=cdtndata  --container logs --name matomo-dump-$date --file /tmp/$file
nc localhost 5001 < /tmp/$file
