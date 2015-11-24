var nunjucks = require('nunjucks');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var postsUpdater = require('./posts-updater');
var s3 = require('./s3');

var projectRoot = path.resolve(__dirname, '../..');
function getTemplateRemote(callback) {
    s3.getObject({
        Bucket: 'shitfrancisco',
        Key: 'src/index.html'
    }, function (error, object) {
        if (error) return callback(error);
        var body = object.Body.toString();
        callback(null, body);
    });
}
function getTemplateLocal(callback) {
    fs.readFile(projectRoot + '/public/src/index.html',
        {encoding: 'utf-8'}, callback);
}

function writeTemplateRemote(contents, callback) {
    s3.putObject({
        Bucket: 'shitfrancisco',
        Key: 'index.html',
        ACL: 'public-read',
        Body: contents,
        ContentType: 'text/html'
    }, function (error) {
        if (error) return callback(error);
        callback(null);
    });
}

function writeTemplateLocal(contents, callback) {
    fs.writeFile(projectRoot + '/public/index.html', contents, callback);
}

var createEndpointLocal = 'http://localhost:8000';
var createEndpointRemote = 'https://99dlan2zfj.execute-api.us-west-2.amazonaws.com/prod';

module.exports = function (isLocal, callback) {
    if (callback === undefined) {
        callback = isLocal;
        isLocal = false;
    }
    console.log("getting " + (isLocal ? "local" : "remote") + " index template");
    var getTemplate = isLocal ? getTemplateLocal : getTemplateRemote;
    getTemplate(function (error, body) {
        if (error) return callback(error);
        nunjucks.configure({
            autoescape: true
        });
        postsUpdater.get(isLocal, function (error, posts) {
            if (error) return callback(error);
            var createEndpoint = isLocal ? createEndpointLocal : createEndpointRemote;
            if (posts && !posts.length) {
                posts = null;
            }
            var indexContents = nunjucks.renderString(body, {
                posts: posts,
                create_endpoint: createEndpoint
            });
            console.log("writing " + (isLocal ? "local" : "remote") + " index");
            var writeTemplate = isLocal ? writeTemplateLocal : writeTemplateRemote;
            writeTemplate(indexContents, callback);
        });
    });
}
