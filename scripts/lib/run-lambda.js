module.exports = function runLambda(isLocal, lambda, event, callback) {
    var context = {
        succeed: markSuccess,
        fail: markFail,
        isLocal: isLocal
    };

    var doneArgs;
    function done() {
        if (doneArgs) return;
        doneArgs = arguments;
    }

    function markSuccess(message) {
        done(null, message);
    }
    function markFail(error) {
        done(error);
    }
    lambda.handler(event, context);
    var int = setInterval(function () {
        if (!doneArgs) return;
        var error = doneArgs[0];
        var message = doneArgs[1];
        clearInterval(int);
        callback(error, message);
    }, 10);
}
