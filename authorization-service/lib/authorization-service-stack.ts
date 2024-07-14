import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import "dotenv/config";

export class AuthorizationServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Lambdas configuration

        const USER_NAME = process.env.USER_NAME as string;
        const USER_PASSWORD = process.env.USER_PASSWORD as string;

        const basicAuthorizer = new lambda.Function(
            this,
            'basicAuthorizerHandler',
            {
                functionName: 'basicAuthorizerHandler',
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "basic-authorizer.handler",
                environment: {
                    [USER_NAME]: USER_PASSWORD,
                },
            },
        );
    }
}
