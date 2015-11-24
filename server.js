var http = require('http');
var url = require('url');
var portNumber = 8000;

var runLambda = require('./scripts/lib/run-lambda');
var createPost = require('./lambdas/create-post');
var deletePost = require('./lambdas/delete-post');

http.createServer(function (req, res) {
    var location = url.parse(req.url);
    console.log("request", JSON.stringify(location, null, 4));

    var requestMatched = false;
    function request(matcher, method, callback) {
        if (arguments.length == 2) {
            callback = method;
            method = null;
        } else if (arguments.length == 1) {
            callback = matcher;
            method = null;
            matcher = null;
        }
        if (requestMatched) {
            return;
        }

        var pathMatch = true;
        if (matcher) {
            var pathParamNames = [];
            var regexMatcher = matcher.replace(/(:[a-zA-Z]+)/, function ($0, $1) {
                var name = $1.slice(1);
                pathParamNames.push(name);
                return '([^/]+)';
            });
            var regex = new RegExp(regexMatcher);
            
            console.log("===============================");
            console.log("matcher", matcher);
            console.log("regex", regex);
            console.log("===============================");

            pathMatch = location.pathname.match(regex);
            if (pathMatch) {
                req.params = {};
                for (var i = 1; i < pathMatch.length; i++) {
                    var name = pathParamNames[i-1];
                    var value = pathMatch[i];
                    req.params[name] = value;
                }
            }
        }

        var methodMatch = true;
        if (method) {
            methodMatch = req.method.toLowerCase() == method.toLowerCase();
        }

        if (pathMatch && methodMatch) {
            console.log('matched ' + req.url +
                ' with path matcher ' + pathMatch +
                ' and method ' + method);
            requestMatched = true;
            callback(req, res);
        } else {
            console.log('DID NOT MATCH ' + req.url + '(method ' + req.method + ')' +
                ' with path matcher ' + pathMatch +
                ' and method ' + method + ' (' + methodMatch + ')');
        }
    }

    res.cors = function() {
        res.setHeader('Access-Control-Allow-Origin', location.hostname);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        return res;
    };
    res.json = function(data) {
        res.setHeader('Content-Type', 'text/json');
        res.write(JSON.stringify(data));
        return res;
    };

    req.body = '';
    req.setEncoding('utf-8');
    req.on("data", function (chunk) {
        req.body += chunk;
    });
    req.on("end", function () {
        try {
            req.json = JSON.parse(req.body.toString());
        } catch (error) {
            console.log("request body is not json");
            req.json = null;
        }
        request('/posts/:id', 'delete', function (req, res) {
            var postId = req.params.id;
            runLambda(true, deletePost, {
                id: postId
            }, function (error) {
                if (error) {
                    res.statusCode = 400;
                    return res.cors().json(error).end();
                }
                res.cors().json(null).end();
            });
        });
        request('/posts', 'post', function (req, res) {
            runLambda(true, createPost, {
                message: req.json.message
            }, function (error, post) {
                if (error) {
                    res.statusCode = 400;
                    return res.cors().json(error).end();
                }
                res.cors().json(post).end();
            });
        });
        
        request('', 'options', function (req, res) {
            res.cors().end();
        });
        request(function (req, res) {
            res.statusCode = 404;
            res.cors().end();
        });
    });
    req.isPaused() && req.resume();
}).listen(portNumber, function (error) {
    if (error) console.error(error) && process.exit(1);
    console.log("Listening on port " + portNumber);
});
