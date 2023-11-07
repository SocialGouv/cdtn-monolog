#!/bin/bash

# Exit on error
set -e

mkdir data

date=$1

az storage blob download \
  --account-key "$AZ_STORAGE_TOKEN" \
  --account-name=cdtndata \
  --container logs \
  --name matomo-dump-$date \
  --file data/$date.json
