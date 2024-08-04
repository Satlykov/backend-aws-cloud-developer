import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import "dotenv/config";

export class AuthorizationServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const USER_NAME_ENV = process.env.USER_NAME as string;
        const USER_PASSWORD_ENV = process.env.USER_PASSWORD as string;

        const basicAuthorizer = new lambda.Function(
            this,
            'BasicAuthorizerHandler',
            {
                functionName: 'BasicAuthorizerHandler',
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset("lambda-functions"),
                handler: "basic-authorizer.handler",
                environment: {
                    [USER_NAME_ENV]: USER_PASSWORD_ENV,
                    USER_NAME: USER_NAME_ENV,
                },
            },
        );
    }
}
