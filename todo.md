Make all the working stuff in one lambda, and call it with the endpoint lambdas

```
exports.handler = function (event, context) {
    var date = new Date();
    var newPost = {
        id: date.getTime(),
        date: date,
        message: event.message
    };
    lambda.invoke({
        FunctionName: 'postManager',
        Payload: JSON.stringify({
            type: 'create',
            post: newPost
        })
    }, function (error, data) {
        if(error) return context.fail(error);
        context.succeed(data);
    });
})
```

update `aws-install-lambdas.sh` to see if the remote lamda is actually different (may want to do this with the updateFunctionConfiguration and the description)

convert all scripts to node. I want this to be an npm module at some point, and the aws sdk is better in node...or at least easier to parse things with.
