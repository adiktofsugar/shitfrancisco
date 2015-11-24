#!/usr/bin/env node

var archiver = require("archiver");
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({
    region: 'us-west-2'
});
var s3 = require('../lambdas/lib/s3');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var async = require('async');
var glob = require('glob');
var mime = require('mime');
var mkdirp = require('mkdirp');

var projectRoot = path.resolve(__dirname, '..');

function updateWebsiteConfig(callback) {
    console.log("Updating website config");
    s3.putBucketWebsite({
        Bucket: 'shitfrancisco',
        WebsiteConfiguration: {
            ErrorDocument: {
              Key: 'error.html'
            },
            IndexDocument: {
              Suffix: 'index.html'
            },
            RedirectAllRequestsTo: {
              HostName: 'shitfranciscosays.com'
            },
            RoutingRules: []
        }
    }, function (error, data) {
        if (error) return callback(error);
        console.log("...website config updated");
        callback();
    });
}

function updateAssets(callback) {
    var g = new glob.Glob('public/**/*', {
        cwd: projectRoot,
        ignore: [
            'public/@(index|error).html',
            'public/posts.yaml'
        ]
    }, function (error, matches) {
        var putFunctions = matches.map(function (match) {
            var localFilepath = path.resolve(projectRoot, match);
            var remoteFilepath = path.relative('public', match);
            var isFile = g.cache[localFilepath] == 'FILE';
            return function (callback) {
                if (!isFile) {
                    return callback();
                }
                console.log(`uploading ${localFilepath} to ${remoteFilepath}`);
                s3.putObject({
                    Bucket: 'shitfrancisco',
                    Key: remoteFilepath,
                    Body: fs.createReadStream(localFilepath),
                    ACL: 'public-read',
                    ContentType: mime.lookup(localFilepath)
                }, callback);
            };
        });
        async.parallel(putFunctions, function (error) {
            if (error) return callback(error);
            console.log("...done uploading assets");
        });
    });
}

function updateLambdas(callback) {
    var lambdaArn = "arn:aws:iam::481400490150:role/shitfrancisco-lambda";
    var lambdasRoot = `${projectRoot}/lambdas`;
    var tmpRoot = `${projectRoot}/tmp`;

    function createLambdaZip(lambdaFolderName, callback) {
        var zipFilepath = `${tmpRoot}/${lambdaFolderName}.zip`;
        var out = fs.createWriteStream(zipFilepath);
        var zip = archiver.create('zip');
        zip.directory(`${lambdasRoot}/${lambdaFolderName}`, lambdaFolderName);
        zip.directory(`${lambdasRoot}/lib`, 'lib');
        zip.finalize();
        zip.pipe(out);

        zip.on("error", function (error) {
            done(error);
        });
        out.on("error", function (error) {
            done(error);
        });
        out.on("close", function () {
            done();
        });

        var isDone = false;
        function done(error) {
            if (isDone) return;
            isDone = true;
            callback(error, zipFilepath);
        }
    }

    function createLambdaZips(lambdasDirEntries, callback) {
        var lambdaFolders = lambdasDirEntries.map(function (entry) {
            return path.resolve(lambdasRoot, entry);
        }).filter(function (entry) {
            var stat = fs.statSync(entry);
            return stat.isDirectory() && path.basename(entry) !== 'lib';
        });
        async.map(lambdaFolders, function (lambdaFolderPath, callback) {
            console.log(`...zipping up ${lambdaFolderPath}`);
            createLambdaZip(path.basename(lambdaFolderPath), function (error, zipFilepath) {
                callback(error, zipFilepath);
            });
        }, function (error, zipFilepaths) {
            if (error) return callback(error);
            callback(null, zipFilepaths);
        });
    }

    function lambdaNeedsUpdate(lambdaFromList, zipFilepath, callback) {
        callback = callback || function () {};
        var lambdaSha256 = lambdaFromList.CodeSha256;
        var shasum = crypto.createHash('sha256');
        fs.createReadStream(zipFilepath)
        .on("data", function (chunk) {
            shasum.update(chunk);
        })
        .on("end", function () {
            var sha256 = shasum.digest('base64');
            if (sha256 === lambdaSha256) {
                return callback(null, false);
            }
            callback(null, true);
        });
    }

    function awsUpdateLambda(lambdaFromList, zipFilepath, callback) {
        var name = getLambdaNameFromFilepath(zipFilepath);
        lambdaNeedsUpdate(lambdaFromList, zipFilepath, function (error, needsUpdate) {
            if (error) return callback(error);
            if (!needsUpdate) {
                console.log(`...Lambda ${name} doesn't need an update`);
                return callback(null);
            }
            console.log(`...Updating lambda ${name}`);
            lambda.updateFunctionCode({
                ZipFile: fs.readFileSync(zipFilepath),
                FunctionName: name
            }, callback);
        });
    }
    function awsCreateLambda(zipFilepath, callback) {
        var name = getLambdaNameFromFilepath(zipFilepath);
        console.log(`...Creating lambda named ${name}`);
        var folderName = path.basename(zipFilepath).replace(/\.zip$/, '');
        var handlerName = `${folderName}/index.handler`;
        lambda.createFunction({
            FunctionName: name,
            Runtime: 'nodejs',
            Role: lambdaArn,
            Handler: handlerName,
            Code: {
                ZipFile: fs.readFileSync(zipFilepath)
            }
        }, callback);
    }

    function awsCreateOrUpdateLambda(lambdaFromList, zipFilepath, callback) {
        if (lambdaFromList) {
            return awsUpdateLambda(lambdaFromList, zipFilepath, callback);
        }
        awsCreateLambda(zipFilepath, callback);
    }

    function getLambdaNameFromFilepath(zipFilepath) {
        var camelCasedName = `-${path.basename(zipFilepath)}`
            .replace(/\.zip$/, '')
            .replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
        return `shitfrancisco-${camelCasedName}`
    }
    
    async.parallel([
        function (callback) {
            console.log("...getting remote lambda information");
            lambda.listFunctions({}, callback);
        },
        function (callback) {
            fs.readdir(lambdasRoot, callback);
        },
        function (callback) {
            mkdirp(tmpRoot, callback);
        }
    ], function (error, returnArguments) {
        if (error) return callback(error);
        var listFunctionsData = returnArguments[0];
        var lambdasDirEntries = returnArguments[1];
        var existingFunctions = listFunctionsData.Functions;

        async.waterfall([
            function (callback) {
                console.log("...creating zips");
                createLambdaZips(lambdasDirEntries, callback);
            },
            function (lambdaZipFilepaths, callback) {
                async.each(lambdaZipFilepaths, function (zipFilepath, callback) {
                    var lambdaFromList = existingFunctions.find(function (existing) {
                        return existing.FunctionName == getLambdaNameFromFilepath(zipFilepath);
                    });
                    awsCreateOrUpdateLambda(lambdaFromList, zipFilepath, callback);
                }, function (error) {
                    callback(error);
                });
            }
        ], function (error) {
            if (error) return callback(error);
            callback(null);
        });
    });
}

var operations = {
    "website": updateWebsiteConfig,
    "assets": updateAssets,
    "lambdas": updateLambdas
};

var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['h'],
    alias: {
        'help': 'h'
    }
});

var usage = `
aws-install [-h] [${Object.keys(operations).join("][")}]
 -h this help
install/update the lambdas and s3 objects on the remote machines
optionally limit by the operations available
`;

if (argv.help) {
    console.log(usage);
    process.exit();
}

var selectedOperationNames = argv._.length ? argv._ : Object.keys(operations);
var selectedOperations = selectedOperationNames.map(function (operationName) {
    return operations[operationName];
});

async.series(selectedOperations, function (error) {
    if (error) console.error(error) && process.exit(1);
    console.log("Done");
});
