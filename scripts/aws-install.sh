#!/bin/bash -eu
project_root="$(cd `dirname ${BASH_SOURCE[0]}`; cd ..; pwd)"
usage="
deploy [-h]
zips up project and deploys it to lambda function in aws
"
while getopts ":h" opt; do
    case "$opt" in
        h) echo "$usage"; exit;;
    esac
done

zip_file="$project_root/lambda.zip"
cd $project_root
zip -r . -x src "$zip_file"

# go through scripts/aws-lambda-* and create/update lambdas to use 
# this zip file and that function

#aws lambda update-function-code --zip-file="$zip_file"
