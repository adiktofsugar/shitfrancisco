#!/usr/bin/env node
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var path = require('path');

var usage = `
build [-h][-r]
    -h help
    -r perform remote
Builds the html
`
var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['h', 'r']
});
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}
var isLocal = !argv.r;

require('../lambdas/lib/build')(isLocal, function (error) {
    if (error) {
        console.error(error);
        return process.exit(1);
    }
    console.log("built " + (isLocal ? "locally" : "remotely"));
});
