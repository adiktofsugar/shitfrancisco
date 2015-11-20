#!/usr/bin/env node
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var path = require('path');

var usage = `
build [-h]
Builds the html
`
var argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}

console.log("building remote index");
require('../lambdas/lib/build')(function (error) {
    if (error) {
        console.error(error);
        return process.exit(1);
    }
    s3.getObject({
        Bucket: 'shitfrancisco',
        Key: 'index.html',
    }, function (error, file) {
        if (error) console.error(error) && process.exit(1);
        var projectRoot = path.resolve(__dirname, '..');
        fs.writeFileSync(projectRoot + '/public/index.html', file.Body);
        console.log("Wrote index locally");
    });
});
