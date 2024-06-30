import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { NotFoundError, handleAPIGatewayError } from "./errorHandler";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {createResponse} from "../utils/create-response";

const dynamoDb = new DynamoDBClient({ region: "eu-central-1" });

const PRODUCT_TABLE_NAME: string = process.env.PRODUCT_TABLE_NAME as string ?? 'products';

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const params = { TableName: PRODUCT_TABLE_NAME  };
    const result = await dynamoDb.send(new ScanCommand(params));
    const products = result.Items?.map(item => ({
      description: item.description.S,
      id: item.id.S,
      price: parseFloat(item.price.N as string),
      title: item.title.S,
      count: parseFloat(item.count.N as string),
    }))

    if (!products?.length) {
      throw new NotFoundError();
    }

    return createResponse(200, products)
  } catch (e: any) {
    console.error("Error retrieving products list:", e);
    return handleAPIGatewayError(e);
  }
};

