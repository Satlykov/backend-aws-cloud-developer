
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { BUCKET_NAME, BUCKET_REGION } from "../models/const";

const s3Client = new S3Client({ region: BUCKET_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("importProductsFile event", event);

    try {
        const { name } = event.queryStringParameters || {};
        if (!name) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: "File name is required" }),
            };
        }

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `uploaded/${name}`,
            ContentType: "text/csv",
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });


        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(url),
        };
    } catch (e) {
        const errorMessage =
            e instanceof Error ? e.message : "Unknown error";
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Could not create a signed URL",
                error: errorMessage,
            }),
        };
    }
};
