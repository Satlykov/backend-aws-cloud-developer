import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct, products } from "./products";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  NotFoundError,
  handleAPIGatewayError,
  BadRequestError,
} from "./errorHandler";

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "eu-central-1" });

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id: string | undefined = event.pathParameters?.id;
    let product: IProduct | undefined;

    if (id) {
      product = products.find((product: IProduct): boolean => product.id === id);
    }

    if (!id || !product) {
      const params: DocumentClient.GetItemInput = {
        TableName: 'products',
        Key: { id },
      };

      const result = await dynamoDb.get(params).promise();
      product = result.Item as IProduct | undefined;
    }

    if (!id) {
      throw new BadRequestError();
    }

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
