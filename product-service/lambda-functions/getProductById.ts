import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { IProduct, products } from "./products";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  NotFoundError,
  handleAPIGatewayError,
  BadRequestError,
} from "./errorHandler";
import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";

const dynamoDb = new DynamoDBClient({ region: "eu-central-1" });

const PRODUCT_TABLE_NAME: string = process.env.PRODUCT_TABLE_NAME as string ?? 'products';

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id: string | undefined = event.pathParameters?.id;
    let product: IProduct | undefined;

    if (!id) {
      throw new BadRequestError();
    }

    const params = { TableName: PRODUCT_TABLE_NAME };

    const result = await dynamoDb.send(new ScanCommand(params));
    product = result.Items?.map(item => ({
      description: item.description.S,
      id: item.id.S,
      price: parseFloat(item.price.N as string),
      title: item.title.S
    })).find(item => item.id === id) as IProduct | undefined;

    if (!product) {
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
      body: JSON.stringify(product),
    };
  } catch (e: any) {
    console.error("Error retrieving product:", e);
    return handleAPIGatewayError(e);
  }
};
