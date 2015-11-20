var s3 = require('./s3');
var yaml = require('js-yaml');

function get(callback) {
    console.log("getting posts");
    s3.getObject({
        Bucket: 'shitfrancisco',
        Key: 'posts.yaml'
    }, function (error, object) {
        if (error && error.code !== 'NoSuchKey') {
            return callback(error);
        }
        var posts;
        if (object) {
            try {
                posts = yaml.safeLoad(object.Body.toString());
            } catch (error) {
                return callback(error);
            }
        }
        callback(null, posts);
    });
}

function update(newPosts, callback) {
    try {
        var body = yaml.safeDump(newPosts);
    } catch (error) {
        return callback(error);
    }
    console.log("putting posts");
    s3.putObject({
        Bucket: 'shitfrancisco',
        Key: 'posts.yaml',
        Body: yaml.safeDump(newPosts)
    }, function (error) {
        if (error) return callback(error);
        callback(null);
    });
}

module.exports = {
    get: get,
    update: update
};
