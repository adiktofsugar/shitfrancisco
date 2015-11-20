#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['D', 'h'],
    string: ['c']
});
var async = require('async');

var usage = `
test-lamda [-h][-c message][-D]
 -h this help
 -c <message> Specify message to go into create
 -D don't delete
Test the lambda function(s) specified
`
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}
var createMessage = argv.c || "whatever";
var skipDelete = argv.D;

var runLambda = require('./lib/run-lambda');

runLambda(require('../lambdas/create-post'), {
    message: createMessage
}, function (error, message) {
    if (error) console.error(error) && process.exit(1);
    console.log(message);
    
    if (skipDelete) {
        console.log("Skipping delete");
        process.exit();
    }

    runLambda(require('../lambdas/delete-post'), {
        id: message.id
    }, function (error, message) {
        if (error) console.error(error) && process.exit(1);
        console.log(message) && process.exit();
    });
});
