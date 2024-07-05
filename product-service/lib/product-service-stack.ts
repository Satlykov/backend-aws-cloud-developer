import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const getTable = (
            tableName: string,
            tableProps: dynamodb.TableProps,
        ): dynamodb.ITable => {
            try {
                return dynamodb.Table.fromTableName(this, `${tableName}Ref`, tableName);
            } catch {
                return new dynamodb.Table(this, tableName, tableProps);
            }
        };

        const productsTable = getTable("products", {
            tableName: "products",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "title", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const stocksTable = getTable("stocks", {
            tableName: "stocks",
            partitionKey: {
                name: "product_id",
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const dynamoPolicy = new iam.PolicyStatement({
            actions: [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:TransactWriteItems"
            ],
            resources: [productsTable.tableArn, stocksTable.tableArn],
        });

        const getProductsListFunction = new lambda.Function(
            this,
            "GetProductsListHandler",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "getProductsList.handler",
                environment: {
                    PRODUCTS_TABLE_NAME: productsTable.tableName,
                },
            },
        );
        getProductsListFunction.addToRolePolicy(dynamoPolicy);

        const getProductByIdFunction = new lambda.Function(
            this,
            "GetProductByIdHandler",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "getProductById.handler",
                environment: {
                    PRODUCTS_TABLE_NAME: productsTable.tableName,
                },
            },
        );
        getProductByIdFunction.addToRolePolicy(dynamoPolicy);

        const createProductFunction = new lambda.Function(
            this,
            "CreateProductHandler",
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "createProduct.handler",
                environment: {
                    PRODUCTS_TABLE_NAME: productsTable.tableName,
                    STOCKS_TABLE_NAME: stocksTable.tableName,
                },
            },
        );
        createProductFunction.addToRolePolicy(dynamoPolicy);

        const catalogBatchProcessFunction = new lambda.Function(
            this,
            'CatalogBatchProcessHandler',
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "catalogBatchProcess.handler",
            }
        )

        const api = new apigateway.RestApi(this, "ProductsApi", {
            restApiName: "Products Service",
            description: "This service serves products",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });

        const productsResource = api.root.addResource("products");
        productsResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getProductsListFunction),
        );

        const productByIdResource = productsResource.addResource("{id}");
        productByIdResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getProductByIdFunction),
        );

        const productResource = api.root.addResource("product");
        productResource.addMethod(
            "PUT",
            new apigateway.LambdaIntegration(createProductFunction),
        );
    }
}
