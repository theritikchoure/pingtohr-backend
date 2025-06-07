const AWS = require("aws-sdk");

const wasabiEndpoint = new AWS.Endpoint("s3.wasabisys.com"); // Wasabi endpoint
const s3 = new AWS.S3({
  endpoint: wasabiEndpoint,
  accessKeyId: process.env.WASABI_ACCESS_KEY,
  secretAccessKey: process.env.WASABI_SECRET_KEY,
  region: "us-east-1", // Wasabi region (change if needed)
});
