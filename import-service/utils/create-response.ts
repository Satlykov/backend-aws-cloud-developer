import type { APIGatewayProxyResult } from "aws-lambda";

export const createResponse = (
    statusCode: number,
    body: object | string,
): APIGatewayProxyResult => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":  "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});
