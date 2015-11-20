#!/bin/bash -eu
project_root="$(cd `dirname ${BASH_SOURCE[0]}`; cd ..; pwd)"
usage="
$(basename ${BASH_SOURCE[0]}) [-h]
installs lambdas in the lambdas folder
"
while getopts ":h" opt; do
    case "$opt" in
        h) echo "$usage"; exit;;
    esac
done

lambda_arn="arn:aws:iam::481400490150:role/shitfrancisco-lambda"

existing_function_names="$(aws\
    --output=text\
    --query='Functions[*].FunctionName'\
    lambda list-functions)"

lambda_base="$project_root/lambdas"
while read package_json; do
    folder=`dirname $package_json`
    cd $folder; npm install
done <<< "$(find $lambda_base -type f -name package.json -not -path "*node_modules*")"

while read lambda_dir; do
    if [[ "$lambda_dir" = "$lambda_base" ]]; then
        continue
    fi
    name="$(basename $lambda_dir)"
    if [[ "$name" = "lib" ]]; then
        continue
    fi

    zip_file="$project_root/tmp/$name.zip"
    mkdir -p $(dirname $zip_file)
    cd "$lambda_base"
    zip -r $zip_file . -i "$name/*" -i "lib/*" >/dev/null

    function_name=""
    for (( i=0; i<${#name}; i++ )); do
        letter="${name:$i:1}";
        if [[ "$letter" = "-" ]]; then
            continue
        fi
        previous_letter="${name:$(( i - 1 )):1}";
        if [[ "$i" = "0" ]] || [[ "$previous_letter" = "-" ]];then
            letter="`echo $letter | tr '[:lower:]' '[:upper:]'`"
        fi
        function_name="$function_name$letter"
    done
    function_name="shitfrancisco-$function_name"
    function_exists=
    for existing_function_name in $existing_function_names; do
        echo "Comparing '$function_name' to '$existing_function_name'"
        if [[ "$existing_function_name" = "$function_name" ]]; then
            function_exists=true
        fi
    done

    if [[ $function_exists ]]; then
        echo "Function $function_name exists, updating..."
        aws lambda update-function-code \
            --zip-file="fileb://$zip_file"\
            --function-name="$function_name"
    else
        echo "Function $function_name doesn't exist, creating..."
        aws lambda create-function \
            --zip-file="fileb://$zip_file"\
            --function-name="$function_name"\
            --role="$lambda_arn"\
            --runtime="nodejs"\
            --handler="$name/index.handler"
    fi

done <<< "$(find "$lambda_base" -type d -maxdepth 1)"
