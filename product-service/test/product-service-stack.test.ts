import * as cdk from "aws-cdk-lib";
import { ProductServiceStack } from "../lib/product-service-stack";
import { Match, Template } from "aws-cdk-lib/assertions";

test("ProductServiceStack creates the correct resources", (): void => {
  const app = new cdk.App();
  const stack = new ProductServiceStack(app, "MyTestStack");
  const template: Template = Template.fromStack(stack);

  const mockProducts: string = JSON.stringify([
    {
      id: "1",
      title: "Product 1",
      description: "Product 1 description",
      price: 99.79,
    },
    {
      id: "2",
      title: "Product 2",
      description: "Product 2 description",
      price: 120.89,
    },
    {
      id: "3",
      title: "Product 3",
      description: "Product 3 description",
      price: 250.99,
    },
  ]);

  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "getProductsList.handler",
    Runtime: "nodejs20.x",
    Environment: {
      Variables: {
        MOCK_PRODUCTS: mockProducts,
      },
    },
  });

  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "getProductsList.handler",
    Runtime: "nodejs20.x",
    Environment: {
      Variables: {
        MOCK_PRODUCTS: mockProducts,
      },
    },
  });

  template.hasResourceProperties("AWS::ApiGateway::RestApi", {
    Name: "Products Service",
  });

  template.resourceCountIs("AWS::ApiGateway::Resource", 2);
  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "products",
  });

  template.hasResourceProperties("AWS::ApiGateway::Resource", {
    PathPart: "{id}",
  });

  template.hasResourceProperties("AWS::ApiGateway::Method", {
    HttpMethod: "GET",
    ResourceId: Match.anyValue(),
    RestApiId: Match.anyValue(),
  });

  template.hasResourceProperties("AWS::ApiGateway::Method", {
    HttpMethod: "GET",
    ResourceId: Match.anyValue(),
    RestApiId: Match.anyValue(),
  });
});
