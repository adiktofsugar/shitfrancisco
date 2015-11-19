var argv = require('minimist')(process.argv.slice(2));
var usage = `
test-lamda [-h]
Test the lambda function
`
if (argv.h || argv.help) {
    console.log(usage);
    process.exit();
}
var runLambda = require('./lib/run-lambda');
runLambda(require('./aws-lambda-create-post'), {
    message: "whatever"
}, function (error, message) {
    if (error) console.error(error) && process.exit(1);
    console.log(message);
    runLambda(require('./aws-lambda-delete-post'), {
        id: message.id
    }, function (error, message) {
        if (error) console.error(error) && process.exit(1);
        console.log(message) && process.exit();
    });
});
