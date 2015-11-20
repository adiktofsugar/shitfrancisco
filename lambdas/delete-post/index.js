var fs = require('fs');
var path = require('path');
var postsUpdater = require('../lib/posts-updater');

exports.handler = function (event, context) {
    if (!event.id) {
        return context.fail("no id");
    }
    var id = event.id;
    postsUpdater.get(function (error, posts) {
        if (error) return context.fail(error);
        if (!posts) {
            posts = [];
        }
        posts = posts.filter(function (post) {
            return post.id !== id;
        });
        postsUpdater.update(posts, function (error) {
            if (error) return context.fail(error);
            require('../lib/build')(function (error) {
                if (error) return context.fail(error);
                context.succeed(null);
            });
        })
    });
};
