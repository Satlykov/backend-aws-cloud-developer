import {
    Duration,
    RemovalPolicy,
    Stack,
    type StackProps,
    aws_apigateway,
    aws_lambda,
    aws_lambda_event_sources,
    aws_s3,
} from "aws-cdk-lib";
import type { Construct } from "constructs";
import { BUCKET_NAME } from "../models/const";

export class ImportServiceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new aws_s3.Bucket(
            this,
            "ProductsImportBucketSatlykov",
            {
                bucketName: BUCKET_NAME,
                removalPolicy: RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                cors: [
                    {
                        allowedOrigins: ["*"],
                        allowedMethods: [aws_s3.HttpMethods.PUT],
                        allowedHeaders: ["*"],
                    },
                ],
            },
        );
        bucket.addLifecycleRule({
            prefix: "uploaded/",
            transitions: [
                {
                    storageClass: aws_s3.StorageClass.INFREQUENT_ACCESS,
                    transitionAfter: Duration.days(30),
                },
            ],
        });

        const importProductsFileLambda = new aws_lambda.Function(
            this,
            "ImportProductsFileBucketSatlykov",
            {
                functionName: "ImportProductsFileLambda",
                runtime: aws_lambda.Runtime.NODEJS_18_X,
                handler: "importProductsFile.handler",
                code: aws_lambda.Code.fromAsset("lambda-functions"),
                environment: {
                    BUCKET_NAME: bucket.bucketName,
                    BUCKET_REGION: this.region,
                },
            },
        );
        bucket.grantReadWrite(importProductsFileLambda);

        const api = new aws_apigateway.RestApi(
            this,
            "ImportServiceApi",
            {
                restApiName: "ImportServiceApi",
            },
        );

        const importResource = api.root.addResource("import");
        importResource.addMethod(
            "GET",
            new aws_apigateway.LambdaIntegration(importProductsFileLambda),
            {
                requestParameters: {
                    "method.request.querystring.name": true,
                },
            },
        );

        const importFileParserLambda = new aws_lambda.Function(
            this,
            "ImportFileParser",
            {
                functionName: "ShopImportFileParserLambda",
                runtime: aws_lambda.Runtime.NODEJS_18_X,
                handler: "importFileParser.handler",
                code: aws_lambda.Code.fromAsset("lambda-functions"),
                environment: {
                    BUCKET_REGION: this.region,
                },
            },
        );
        bucket.grantReadWrite(importFileParserLambda);
        bucket.grantDelete(importFileParserLambda);

        const s3EventSource = new aws_lambda_event_sources.S3EventSource(bucket, {
            events: [aws_s3.EventType.OBJECT_CREATED],
            filters: [{ prefix: "uploaded/" }],
        });
        importFileParserLambda.addEventSource(s3EventSource);
    }
}
