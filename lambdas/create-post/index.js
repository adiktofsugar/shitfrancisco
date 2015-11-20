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
    var isLocal = context.isLocal;
    postsUpdater.get(isLocal, function (error, posts) {
        if (error) return context.fail(error);
        if (!posts) {
            posts = [];
        }
        newPost.id = posts.length;
        posts.push(newPost);
        postsUpdater.update(isLocal, posts, function (error) {
            if (error) return context.fail(error);
            require('../lib/build')(isLocal, function (error) {
                if (error) return context.fail(error);
                context.succeed(newPost);
            });
        })
    });
};
