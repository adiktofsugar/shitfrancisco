#!/usr/bin/env node
var usage = `
build [-h]
Builds the html
`
var argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}

require('./lib/build')();
console.log("Wrote index.html");
