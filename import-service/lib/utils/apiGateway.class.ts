import { Construct } from "constructs";
import { ImportProductsFile } from "./importProductsFile.class";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { RemovalPolicy } from "aws-cdk-lib";

export class ApiGateway {
  constructor(
    scope: Construct,
    id: string,
    importProductsFile: ImportProductsFile,
  ) {
    const api = new apigateway.RestApi(scope, id, {
      restApiName: "Import Service API",
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
    });

    const importProductsFileResource = api.root.addResource("import");

    const importProductsFileFunctionIntegration =
      new apigateway.LambdaIntegration(importProductsFile.lambdaFunction);

    importProductsFileResource.addMethod(
      "GET",
      importProductsFileFunctionIntegration,
      { requestParameters: { "method.request.querystring.name": true } },
    );

    const deployment = new apigateway.Deployment(scope, "Deployment", { api });

    api.deploymentStage = new apigateway.Stage(scope, "devStage", {
      stageName: "dev",
      deployment,
    });
  }
}
