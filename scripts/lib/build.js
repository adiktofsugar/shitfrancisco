var nunjucks = require('nunjucks');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

module.exports = function () {
    var projectRoot = path.resolve(__dirname, '../..');

    nunjucks.configure({
        autoescape: true
    });
    var postsRaw = fs.readFileSync(projectRoot + '/posts.yaml');
    var posts = yaml.safeLoad(postsRaw);
    var indexContents = nunjucks.render(projectRoot + '/src/index.html', {
        posts: posts
    });
    fs.writeFileSync(`${projectRoot}/public/index.html`, indexContents);
}
