import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { products } from "../lambda-functions/products";

const dynamodbClient = new DynamoDBClient({ region: "eu-central-1" });
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME ?? 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME ?? 'stocks';

const populateTables = async () => {
    try {
        for (const product of products) {
            await dynamodb.send(new PutCommand({
                TableName: PRODUCT_TABLE_NAME,
                Item: product,
            }));
            console.log(`Inserted product: ${JSON.stringify(product)}`);

            await dynamodb.send(new PutCommand({
                TableName: STOCK_TABLE_NAME,
                Item: {
                    product_id: product.id,
                    count: product.count,
                }
            }));
            console.log(`Inserted stock: ${JSON.stringify({
                product_id: product.id,
                count: product.count,
            })}`);
        }
    } catch (e: any) {
        console.error(e.message);
    }
};

populateTables();
