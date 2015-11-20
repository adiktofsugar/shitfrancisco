var AWS = require('aws-sdk');
var s3 = new AWS.S3({
    region: 'us-west-1'
});
module.exports = s3;
