import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handler } from "../lambda-functions/getProductsList";
import { products } from "../lambda-functions/products";

describe("getProductsList lambda function", (): void => {
  let mockProducts = "[]";

  beforeEach((): void => {
    mockProducts = JSON.stringify(products);
  });

  afterEach((): void => {
    mockProducts = "[]";
  });

  it("should return status 200 and a list of all products", async (): Promise<void> => {
    const event: APIGatewayProxyEvent = {} as APIGatewayProxyEvent;
    const context: Context = {} as Context;
    const result = (await handler(
        event,
        context,
        () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).length).toBeGreaterThan(0);
  });
});
