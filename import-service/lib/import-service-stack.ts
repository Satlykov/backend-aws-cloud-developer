import * as cdk from "aws-cdk-lib";
import {
    Duration,
    RemovalPolicy,
    Stack,
    type StackProps,
    aws_apigateway,
    aws_lambda,
    aws_lambda_event_sources,
    aws_s3, aws_sqs, aws_sns_subscriptions, aws_sns, aws_dynamodb,
} from "aws-cdk-lib";
import type { Construct } from "constructs";
import {TokenAuthorizer} from "aws-cdk-lib/aws-apigateway";

const BUCKET_NAME = process.env.name ??  "import-service-s3-satlykov-rustam";
const PRODUCT_TABLE_NAME = 'products';
const STOCK_TABLE_NAME =  'stocks';

export class ImportServiceStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const productsTable = aws_dynamodb.Table.fromTableName(
            this,
            `${PRODUCT_TABLE_NAME}Ref`,
            PRODUCT_TABLE_NAME,
        );

        const stocksTable = aws_dynamodb.Table.fromTableName(
            this,
            `${STOCK_TABLE_NAME}Ref`,
            STOCK_TABLE_NAME,
        );

        const catalogItemsQueue = new aws_sqs.Queue(
            this,
            "CatalogItemsQueue",
            {
                queueName: "CatalogItemsQueue"
            },
        );
        const sqsEventSource = new aws_lambda_event_sources.SqsEventSource(
            catalogItemsQueue,
            {
                batchSize: 5,
            },
        );

        const createProductTopic = new aws_sns.Topic(
            this,
            "CreateProductSNSTopic",
            {
                topicName: "CreateProductSNSTopic",
            },
        );
        createProductTopic.addSubscription(
            new aws_sns_subscriptions.EmailSubscription('satlikov.rustam.mail@gmail.com'),
        );
        createProductTopic.addSubscription(
            new aws_sns_subscriptions.EmailSubscription(
                'rustam.satlykov@proton.me',
                {
                    filterPolicy: {
                        price: aws_sns.SubscriptionFilter.numericFilter({
                            greaterThanOrEqualTo: 300,
                        }),
                    },
                },
            ),
        );

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

        const basicAuthorizerLambda = aws_lambda.Function.fromFunctionName(
            this,
            'BasicAuthorizerHandler',
            'BasicAuthorizerHandler',
        );
        const basicTokenAuthorizer = new TokenAuthorizer(
            this,
            "BasicTokenAuthorizer",
            {
                authorizerName: "BasicTokenAuthorizer",
                handler: basicAuthorizerLambda,
                identitySource: "method.request.header.Authorization",
            },
        );

        const importProductsFileLambda = new aws_lambda.Function(
            this,
            "ImportProductsFileLambda",
            {
                functionName: "ImportProductsFileLambda",
                runtime: aws_lambda.Runtime.NODEJS_18_X,
                handler: "importProductsFile.handler",
                code: aws_lambda.Code.fromAsset("lambda-functions"),
                environment: {
                    BUCKET_NAME: bucket.bucketName,
                    BUCKET_REGION: this.region,
                    CATALOG_ITEMS_QUEUE_URL: catalogItemsQueue.queueUrl
                },
            },
        );
        bucket.grantReadWrite(importProductsFileLambda);

        const api = new aws_apigateway.RestApi(
            this,
            "ImportServiceApi",
            {
                restApiName: "ImportServiceApi",
                defaultCorsPreflightOptions: {
                    allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
                    allowMethods: aws_apigateway.Cors.ALL_METHODS,
                    allowHeaders: aws_apigateway.Cors.DEFAULT_HEADERS,
                },
            },
        );
        api.addGatewayResponse(
            "ImportServiceResponseUnauthorized",
            {
                type: aws_apigateway.ResponseType.UNAUTHORIZED,
                responseHeaders: {
                    "Access-Control-Allow-Origin": "'*'",
                    "Content-Type": "'application/json'",
                },
            },
        );
        api.addGatewayResponse(
            "ImportServiceResponseDefaultForbidden",
            {
                type: aws_apigateway.ResponseType.ACCESS_DENIED,
                responseHeaders: {
                    "Access-Control-Allow-Origin": "'*'",
                    "Content-Type": "'application/json'",
                },
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
                authorizer: basicTokenAuthorizer,
                authorizationType: aws_apigateway.AuthorizationType.CUSTOM,
            },
        );

        const importFileParserLambda = new aws_lambda.Function(
            this,
            "ImportFileParserLambda",
            {
                functionName: "ImportFileParserLambda",
                runtime: aws_lambda.Runtime.NODEJS_18_X,
                handler: "importFileParser.handler",
                code: aws_lambda.Code.fromAsset("lambda-functions"),
                environment: {
                    REGION: this.region,
                    SQS_URL: catalogItemsQueue.queueUrl,
                },
            },
        );
        bucket.grantReadWrite(importFileParserLambda);
        catalogItemsQueue.grantSendMessages(importFileParserLambda);
        bucket.grantDelete(importFileParserLambda);

        const s3EventSource = new aws_lambda_event_sources.S3EventSource(bucket, {
            events: [aws_s3.EventType.OBJECT_CREATED],
            filters: [{ prefix: "uploaded/" }],
        });
        importFileParserLambda.addEventSource(s3EventSource);

        const catalogBatchProcessFunction = new aws_lambda.Function(
            this,
            'CatalogBatchProcessHandler',
            {
                functionName: "CatalogBatchProcessHandler",
                runtime: aws_lambda.Runtime.NODEJS_18_X,
                code: aws_lambda.Code.fromAsset("lambda-functions"),
                handler: "catalogBatchProcess.handler",
                environment: {
                    REGION: this.region,
                    TOPIC_ARN: createProductTopic.topicArn,
                    STOCKS_TABLE_NAME: stocksTable.tableName,
                    PRODUCT_TABLE_NAME: productsTable.tableName,
                },
            }
        )
        productsTable.grantWriteData(catalogBatchProcessFunction);
        stocksTable.grantWriteData(catalogBatchProcessFunction);
        createProductTopic.grantPublish(catalogBatchProcessFunction);
        catalogBatchProcessFunction.addEventSource(sqsEventSource);
    }
}
