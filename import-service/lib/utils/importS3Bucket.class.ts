import { Construct } from "constructs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

export class ImportS3Bucket {
  public readonly bucket;

  constructor(scope: Construct, id: string, bucketName: string) {
    this.bucket = new s3.Bucket(
        scope,
        "ImportServiceS3Bucket",
        {
          bucketName,
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          cors: [
            {
              allowedOrigins: ["*"],
              allowedMethods: [s3.HttpMethods.PUT],
              allowedHeaders: ["*"],
            },
          ],
        }
    );

    this.addLifecycleRule();
  }

  private addLifecycleRule(): void {
    this.bucket.addLifecycleRule({
      prefix: "uploaded/",
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: Duration.days(30),
        },
      ],
    });
  }
}
