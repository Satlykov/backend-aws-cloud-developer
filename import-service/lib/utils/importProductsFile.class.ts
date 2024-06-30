import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ImportS3Bucket } from "./importS3Bucket.class";

export class ImportProductsFile {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, bucket: ImportS3Bucket) {
    this.lambdaFunction = new lambda.Function(
      scope,
      "importProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "importProductsFile.handler",
        environment: { BUCKET_NAME: bucket.bucket.bucketName },
      },
    );

    bucket.bucket.grantReadWrite(this.lambdaFunction);
    bucket.bucket.grantPut(this.lambdaFunction);
  }
}
