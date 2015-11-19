var fs = require('fs');
var yaml = require('js-yaml');
var path = require('path');

exports.handler = function (event, context) {
    if (!event.id) {
        return context.fail("no id");
    }
    var projectRoot = path.resolve(__dirname, '..');
    var postsPath = projectRoot + '/posts.yaml';

    try {
        var posts = yaml.safeLoad(fs.readFileSync(postsPath));
        var id = event.id;
        posts = posts.filter(function (post) {
            return post.id !== id;
        });
        fs.writeFileSync(postsPath, yaml.safeDump(posts));
        require('./lib/build')();
    } catch (error) {
        return context.fail(error);
    }
    context.success(null);
};
