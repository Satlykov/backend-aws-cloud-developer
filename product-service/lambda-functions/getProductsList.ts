import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { NotFoundError, handleAPIGatewayError } from "./errorHandler";
import { IProduct } from "./products";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "eu-central-1" });

const PRODUCT_TABLE_NAME: string = process.env.PRODUCT_TABLE_NAME as string ?? 'products';

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const params = { TableName: PRODUCT_TABLE_NAME  };
    const result = await dynamoDb.scan(params).promise();
    const products: IProduct[] = result.Items as IProduct[];

    if (!products.length) {
      throw new NotFoundError();
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
    console.error("Error retrieving products list:", e);
    return handleAPIGatewayError(e);
  }
};

