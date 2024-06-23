import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ProductInfo } from "./product.interface";
import { v4 } from "uuid";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}") as ProductInfo;
    const id = v4();
    const { title, description, price, count } = body;

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: "products",
      Item: { id, title, description, price },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: "stocks",
      Item: { id: id, count },
    };

    await dynamodb.put(productParams).promise();
    await dynamodb.put(stockParams).promise();

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
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: e.message }),
    };
  }
};
