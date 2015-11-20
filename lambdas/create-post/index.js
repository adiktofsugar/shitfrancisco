var fs = require('fs');
var path = require('path');
var postsUpdater = require('../lib/posts-updater');
var s3 = require('../lib/s3');

exports.handler = function (event, context) {
    if (!event.message) {
        return context.fail("no message");
    }
    var newPost = {
        date: new Date(),
        message: event.message
    };
    s3.listBuckets({
    }, function (error, data) {
        if (error) return context.fail(error);
        var buckets = data.Buckets;
        buckets.forEach(function (bucket) {
            console.log("bucket name " + bucket.Name);
        });
        postsUpdater.get(function (error, posts) {
            if (error) return context.fail(error);
            if (!posts) {
                posts = [];
            }
            newPost.id = posts.length;
            posts.push(newPost);
            postsUpdater.update(posts, function (error) {
                if (error) return context.fail(error);
                require('../lib/build')(function (error) {
                    if (error) return context.fail(error);
                    context.succeed(newPost);
                });
            })
        });
    });
};
