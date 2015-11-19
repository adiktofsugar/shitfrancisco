var fs = require('fs');
var yaml = require('js-yaml');
var path = require('path');

exports.handler = function (event, context) {
    if (!event.message) {
        return context.fail("no message");
    }
    var newPost = {
        date: new Date(),
        message: event.message
    };
    var projectRoot = path.resolve(__dirname, '..');
    var postsPath = projectRoot + '/posts.yaml';

    try {
        var posts = yaml.safeLoad(fs.readFileSync(postsPath));
        newPost.id = posts.length;
        posts.push(newPost);
        fs.writeFileSync(postsPath, yaml.safeDump(posts));
        require('./lib/build')();
    } catch (error) {
        return context.fail(error);
    }
    context.success(newPost);
};
