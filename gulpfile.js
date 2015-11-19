var gulp = require('gulp');
var nunjucks = require('nunjucks');
var through = require('through2');
var fs = require('fs');
var yaml = require('js-yaml');

gulp.task('build', function () {
    nunjucks.configure({
        autoescape: true
    });
    return gulp.src('src/index.html')
        .pipe(through.obj(function transform (file, encoding, callback) {
            var postsRaw = fs.readFileSync('posts.yaml');

            var posts;
            try {
                posts = yaml.safeLoad(postsRaw);
            } catch (error) {
                return callback(error);
            }
            file.contents = Buffer(nunjucks.render(file.path, {
                posts: posts
            }));
            callback(null, file);
        }))
        .pipe(gulp.dest('target'));
});

gulp.task('watch', function () {
    //gulp.watch('src/style.css', ['css']);
    gulp.watch(['src/index.html', 'posts.yaml'], ['build']);
});

gulp.task('default', ['watch', 'build']);
