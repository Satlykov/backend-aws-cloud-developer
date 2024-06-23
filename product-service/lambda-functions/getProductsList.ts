import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct } from "./product.interface";
import { NotFoundError, handleAPIGatewayError } from "./errorHandler";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const params = { TableName: "products" };
    const result = await dynamoDb.scan(params).promise();
    const products: IProduct[] = result.Items as IProduct[];

    if (!products.length) {
      throw new NotFoundError("No products found");
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(products),
    };
  } catch (e: any) {
    return handleAPIGatewayError(e);
  }
};
