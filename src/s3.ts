import aws from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

export const region = "eu-central-1";
export const bucketName = "fluffy-a1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
console.log(accessKeyId, secretAccessKey);
export const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});
