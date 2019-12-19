#!/bin/bash

volume=`pwd`/scripts
docker run -e AZ_STORAGE_TOKEN=$AZ_STORAGE_TOKEN -v $volume:/scripts  mcr.microsoft.com/azure-cli bash /scripts/dump-matomo-yesterday.sh
