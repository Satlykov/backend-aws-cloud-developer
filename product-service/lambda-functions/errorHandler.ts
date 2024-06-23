import { APIGatewayProxyResult } from "aws-lambda";

interface ErrorResponse {
  statusCode: number;
  message: string;
}

const errorMap: Record<string, ErrorResponse> = {
  NotFoundError: { statusCode: 404, message: "Not found" },
  BadRequestError: { statusCode: 400, message: "Bad request" },
  InternalServerError: { statusCode: 500, message: "Internal server error" },
};

export function handleAPIGatewayError(error: any): APIGatewayProxyResult {
  const defaultError: ErrorResponse = {
    statusCode: 500,
    message: "Unknown error occurred",
  };

  if (error instanceof Error && error.name in errorMap) {
    const { statusCode, message } = errorMap[error.name];
    return createErrorResponse(statusCode, message);
  } else {
    return createErrorResponse(defaultError.statusCode, defaultError.message);
  }
}

function createErrorResponse(
  statusCode: number,
  message: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  };
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
