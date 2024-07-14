import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";
import {BadRequestError, handleAPIGatewayError} from "./errorHandler";
import { ProductInfo } from "./products";

const ddbClient = new DynamoDBClient({ region: "eu-central-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME ?? 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME ?? 'stocks';

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const product: ProductInfo = event.body ? JSON.parse(event.body) : {};
    const id: string = randomUUID();
    const { title, description, price, count = 0 } = product;

    if (!title || !description || !price ) {
      throw new BadRequestError();
    }

    const productParams = {
      TableName: PRODUCT_TABLE_NAME,
      Item: { id, title, description, price, count },
    };

    const stockParams = {
      TableName: STOCK_TABLE_NAME,
      Item: { product_id: id, count },
    };

    const transactParams = {
      TransactItems: [
        { Put: { ...productParams } },
        { Put: { ...stockParams } },
      ],
    };

    await ddbDocClient.send(new TransactWriteCommand(transactParams));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":  "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Product created successfully" }),
    }
  } catch (e: any) {
    console.error("Error creating product:", e);
    return handleAPIGatewayError(e);
  }
};
