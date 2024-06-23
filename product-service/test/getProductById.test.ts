import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handler } from "../lambda-functions/getProductById";
import { products } from "../lambda-functions/products";

describe("getProductById lambda function", (): void => {
  let mockProducts = "[]";

  beforeEach((): void => {
    mockProducts = JSON.stringify(products);
  });

  afterEach((): void => {
    mockProducts = "[]";
  });

  it("should return status 200 and the product if found", async (): Promise<void> => {
    const event: APIGatewayProxyEvent = {
      pathParameters: { id: "f6e0a95a-271f-4f25-9e33-299aacc669ca" },
    } as any;
    const context: Context = {} as Context;
    const result = (await handler(
        event,
        context,
        (): void => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).title).toBe("Product 2");
  });
});
