var fs = require('fs');
var path = require('path');
var postsUpdater = require('../lib/posts-updater');

exports.handler = function (event, context) {
    var isLocal = context.isLocal;
    var id = event.id;
    if (!id) {
        return context.fail("no id");
    }
    postsUpdater.get(isLocal, function (error, posts) {
        if (error) return context.fail(error);
        if (!posts) {
            posts = [];
        }
        console.log("posts before", JSON.stringify(posts, null, 4));
        posts = posts.filter(function (post) {
            return String(post.id) !== String(id);
        });
        console.log("posts after", JSON.stringify(posts, null, 4));
        postsUpdater.update(isLocal, posts, function (error) {
            if (error) return context.fail(error);
            require('../lib/build')(isLocal, function (error) {
                if (error) return context.fail(error);
                context.succeed(null);
            });
        })
    });
};
