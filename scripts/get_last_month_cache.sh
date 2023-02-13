#!/bin/bash

DATA_FOLDER="data-queries"

if [ -z "$1" ]; then
  echo "Please provide the path to the cache folder"
  exit 1
fi

rm -rf $DATA_FOLDER
mkdir $DATA_FOLDER
DATE=$(date -v -1m "+%Y-%m")
echo "COPY DATA FROM LAST MONTH ${DATE}"
cp $1/$DATE* $DATA_FOLDER/
