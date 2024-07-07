import * as cdk from "aws-cdk-lib";
import { SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { randomUUID } from "node:crypto";
import { BadRequestError } from "./errorHandler";

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME ?? 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME ?? 'stocks';
const REGION =  process.env.REGION ?? "eu-central-1";

const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: REGION });


export const handler: SQSHandler = async (event: SQSEvent) : Promise<void> => {
    console.log("Received SQS event:", event);

    for (const record of event.Records) {
        const { title, description, price, count = 0 } = JSON.parse(record.body);

        const topicArn = cdk.Fn.importValue('CreateProductTopicArn');

        try {
            if (!title || !description || typeof Number(price) !== 'number' || typeof Number(count) !== 'number') {
                throw new BadRequestError();
            }

            const id: string = randomUUID();

            const newProduct = { id, title, description, price, count };
            const productParams = {
                TableName: PRODUCT_TABLE_NAME,
                Item: newProduct,
            };

            const newStock = { product_id: id, count };
            const stockParams = {
                TableName: STOCK_TABLE_NAME,
                Item: newStock,
            };

            const transactParams = {
                TransactItems: [
                    { Put: { ...productParams } },
                    { Put: { ...stockParams } },
                ],
            };

            await ddbDocClient.send(new TransactWriteCommand(transactParams));

            const snsMessage = {
                Subject: 'New Product Created',
                Message: JSON.stringify({
                    product: newProduct,
                    stock: newStock
                }),
                TopicArn: topicArn,
                MessageAttributes: {
                    price: {
                        DataType: 'Number',
                        StringValue: `${price}`
                    }
                }
            };

            await snsClient.send(new PublishCommand(snsMessage));
            console.log('Product created:', JSON.stringify(newProduct));
        } catch (e) {
            console.error("Error processing SQS record:", e);
        }

    }
}
