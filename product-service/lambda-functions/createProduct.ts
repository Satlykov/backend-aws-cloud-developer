import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { v4 } from "uuid";

import { handleAPIGatewayError } from "./errorHandler";
import { BadRequestError } from "./errorHandler";
import { ProductInfo } from "./products";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const id: string = v4();
    const body: ProductInfo = JSON.parse(event.body || "{}");
    const { title, description, price, count = 0 } = body;

    if (!title || !description || !price) {
      throw new BadRequestError();
    }
    console.log("Here code continue to work if no ERROR");

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: 'products',
      Item: { id, title, description, price },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: 'stocks',
      Item: { product_id: id, count },
    };

    const transactParams: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput =
        {
          TransactItems: [{ Put: productParams }, { Put: stockParams }],
        };

    await dynamodb.transactWrite(transactParams).promise();

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
