var fs = require('fs');
var s3 = require('./s3');
var yaml = require('js-yaml');
var path = require('path');

var projectRoot = path.resolve(__dirname, '../..');

function getPostsRemote(callback) {
    s3.getObject({
        Bucket: 'shitfrancisco',
        Key: 'posts.yaml'
    }, function (error, object) {
        if (error && error.code !== 'NoSuchKey') {
            return callback(error);
        }
        callback(null, object && object.Body.toString());
    });
}
function getPostsLocal(callback) {
    var postsPath = projectRoot + '/public/posts.yaml';
    if (fs.existsSync(postsPath)) {
        fs.readFile(postsPath, 'utf-8', callback);
    } else {
        fs.writeFile(postsPath, yaml.safeDump([]), function (error) {
            if (error) return callback(error);
            getPostsLocal(callback);
        });
    }
}

function writePostsRemote(postsRaw, callback) {
    s3.putObject({
        Bucket: 'shitfrancisco',
        Key: 'posts.yaml',
        Body: postsRaw
    }, callback);
}
function writePostsLocal(postsRaw, callback) {
    fs.writeFile(projectRoot + '/public/posts.yaml',
        postsRaw, callback);
}


function get(isLocal, callback) {
    if (callback === undefined) {
        callback = isLocal;
        isLocal = false;
    }
    var getPosts = isLocal ? getPostsLocal : getPostsRemote;
    console.log("getting " + (isLocal ? "local" : "remote") + " posts");
    getPosts(function (error, postsRaw) {
        if (error) return callback(error);
        var posts;
        if (postsRaw) {
            try {
                posts = yaml.safeLoad(postsRaw);
            } catch (error) {
                return callback(error);
            }
        }
        callback(null, posts);
    });
}

function update(isLocal, newPosts, callback) {
    if (callback === undefined) {
        callback = newPosts;
        newPosts = isLocal;
        isLocal = false;
    }
    try {
        var body = yaml.safeDump(newPosts);
    } catch (error) {
        return callback(error);
    }
    var writePosts = isLocal ? writePostsLocal : writePostsRemote;
    console.log("putting " + (isLocal ? "local" : "remote") + " posts");
    writePosts(body, function (error) {
        if (error) return callback(error);
        callback(null);
    });
}

module.exports = {
    get: get,
    update: update
};
