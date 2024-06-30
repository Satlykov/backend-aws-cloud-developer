import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cr from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";

type CorsPolicy = {
  AllowedHeaders: string[];
  AllowedMethods: string[];
  AllowedOrigins: string[];
};

export class ImportS3Bucket {
  public static readonly CORS_POLICY: CorsPolicy = {
    AllowedHeaders: ["*"],
    AllowedMethods: ["PUT"],
    AllowedOrigins: ["*"],
  };
  public readonly bucket: s3.IBucket;

  constructor(scope: Construct, id: string, bucketName: string) {
    this.bucket = new s3.Bucket(scope, id, {
      bucketName,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    new cr.AwsCustomResource(scope, "PutCorsConfig", {
      onCreate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: this.bucket.bucketName,
          CORSConfiguration: {
            CORSRules: [ImportS3Bucket.CORS_POLICY],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `PutCorsConfiguration-${this.bucket.bucketName}`,
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    this.addBucketPolicies();
  }

  private addBucketPolicies(): void {
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        resources: [this.bucket.arnForObjects("*")],
        principals: [new iam.AnyPrincipal()],
      }),
    );
  }
}
