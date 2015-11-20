var nunjucks = require('nunjucks');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var postsUpdater = require('./posts-updater');
var s3 = require('./s3');

module.exports = function (callback) {
    console.log("getting index template");
    s3.getObject({
        Bucket: 'shitfrancisco',
        Key: 'src/index.html'
    }, function (error, object) {
        if (error) return callback(error);
        nunjucks.configure({
            autoescape: true
        });
        var body = object.Body.toString();
        console.log("getting remote posts");
        postsUpdater.get(function (error, posts) {
            if (error) return callback(error);
            console.log("posts - " + JSON.stringify(posts, null, 4));
            var indexContents = nunjucks.renderString(body, {
                posts: posts
            });
            console.log("writing remote index");
            s3.putObject({
                Bucket: 'shitfrancisco',
                Key: 'index.html',
                ACL: 'public-read',
                Body: indexContents,
                ContentType: 'text/html'
            }, function (error) {
                if (error) return callback(error);
                callback(null);
            });
        });
    });
}
