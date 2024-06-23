import * as AWS from "aws-sdk";
import { products } from "./products";

AWS.config.update({ region: 'us-east-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "eu-central-1" });

const PRODUCT_TABLE_NAME = process.env.PRODUCT_TABLE_NAME as string ?? 'products';
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME as string ?? 'stock';

const populateTables = async () => {
    try {
        for (const product of products) {
            await dynamodb.put({
                TableName: PRODUCT_TABLE_NAME,
                Item: product
            }).promise();
            console.log(`Inserted product: ${JSON.stringify(product)}`);

            await dynamodb.put({
                TableName: STOCK_TABLE_NAME,
                Item: {
                    id: product.id,
                    count: product.count,
                }
            }).promise();
            console.log(`Inserted stock: ${JSON.stringify({
                id: product.id,
                count: product.count,
            })}`);
        }
    } catch (e: any) {
        console.error(e.message);
    }
};

populateTables().catch(e => console.error(e));
