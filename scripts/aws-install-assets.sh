#!/bin/bash -eu
project_root="$(cd `dirname ${BASH_SOURCE[0]}`; cd ..; pwd)"
usage="
$(basename ${BASH_SOURCE[0]}) [-h]
syncs assets to s3
"
while getopts ":h" opt; do
    case "$opt" in
        h) echo "$usage"; exit;;
    esac
done

aws s3 website s3://shitfrancisco/ \
    --index-document "index.html"\
    --error-document "error.html"

aws s3 sync "$project_root/public" s3://shitfrancisco/\
    --exclude "index.html"\
    --exclude "posts.yaml"\
    --acl public-read
