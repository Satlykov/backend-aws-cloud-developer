import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { BadRequestError, handleAPIGatewayError } from "./errorHandler";
import { ProductInfo } from "./products";

const dynamodbClient = new DynamoDBClient({ region: "eu-central-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME ?? 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME ?? 'stock';

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const id: string = uuidv4();
    const body: ProductInfo = JSON.parse(event.body || "{}");
    const { title, description, price, count = 0 } = body;

    if (!title || !description || !price) {
      throw new BadRequestError();
    }
    console.log("Here code continue to work if no ERROR");

    const productParams = {
      TableName: PRODUCT_TABLE_NAME,
      Item: { id, title, description, price },
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

    await dynamodb.send(new TransactWriteCommand(transactParams));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Product created successfully" }),
    };
  } catch (e: any) {
    console.error("Error creating product:", e);
    return handleAPIGatewayError(e);
  }
};
