#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['h', 'r'],
    alias: {
        'h': 'help'
    },
    string: ['c']
});
var async = require('async');

var usage = `
create-post [-h][-r] [message]
 -h this help
 -r do remotely
 message the message to post
Create a post using the lamnbda functions
`
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}
var message = argv._[0] || 'whatever';
var runLambda = require('./lib/run-lambda');
var isLocal = !argv.r;

runLambda(isLocal, require('../lambdas/create-post'), {
    message: message
}, function (error, post) {
    if (error) console.error(error) && process.exit(1);
    console.log(post);
});
