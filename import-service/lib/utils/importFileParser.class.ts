import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { ImportS3Bucket } from "./importS3Bucket.class";
import * as s3_notifications from "aws-cdk-lib/aws-s3-notifications";

export class ImportFileParser {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, bucket: ImportS3Bucket) {
    this.lambdaFunction = new lambda.Function(
      scope,
      "importFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "importFileParser.handler",
        environment: { BUCKET_NAME: bucket.bucket.bucketName },
      },
    );
    bucket.bucket.grantReadWrite(this.lambdaFunction);
    bucket.bucket.grantPut(this.lambdaFunction);
    bucket.bucket.grantDelete(this.lambdaFunction);

    bucket.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3_notifications.LambdaDestination(this.lambdaFunction),
      { prefix: "uploaded/" },
    );
  }
}
