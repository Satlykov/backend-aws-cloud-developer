import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handler } from "../lambda-functions/getProductById";
import { products } from "../lambda-functions/products";
import { IProduct } from "../lambda-functions/product.interface";

describe("getProductById lambda function", (): void => {
  beforeEach((): void => {
    process.env.MOCK_PRODUCTS = JSON.stringify(products);
  });

  afterEach((): void => {
    delete process.env.MOCK_PRODUCTS;
  });

  it("should return status 200 and the product if found", async (): Promise<void> => {
    const event: APIGatewayProxyEvent = {
      pathParameters: { id: "1" },
    } as any;
    const context: Context = {} as Context;
    const result = (await handler(
      event,
      context,
      (): void => {},
    )) as APIGatewayProxyResult;

    const expectedProduct: IProduct = products[0];

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(expectedProduct));
  });

  it("should return status 404 if product is not found", async (): Promise<void> => {
    const event: APIGatewayProxyEvent = {
      pathParameters: { id: "9999" },
    } as any;
    const context: Context = {} as Context;
    const result = (await handler(
      event,
      context,
      (): void => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: "Product not found" }));
  });

  it("should return status 400 if product ID is not provided", async (): Promise<void> => {
    const event: APIGatewayProxyEvent = {} as APIGatewayProxyEvent;
    const context: Context = {} as Context;
    const result = (await handler(
      event,
      context,
      (): void => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(
      JSON.stringify({ message: "Product ID is required" }),
    );
  });
});
