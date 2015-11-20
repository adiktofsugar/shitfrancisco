var Server = require('./lambda-server');

var server = new Server({
    s3Bucket: 'shitfrancisco',
    s3Root: 'public'
});

server.api.post('/posts', server.lambdas.createPost)
server.api.del('/posts/:id', server.lambdas.deletePost)

server.listen(3000);
