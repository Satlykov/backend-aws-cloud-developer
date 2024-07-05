import { APIGatewayProxyResult } from "aws-lambda";

interface ErrorResponse {
  statusCode: number;
  message: string;
}

const errorMap: Record<string, ErrorResponse> = {
  NotFoundError: { statusCode: 404, message: "404 Not found" },
  BadRequestError: { statusCode: 400, message: "400 Bad request" },
  InternalServerError: { statusCode: 500, message: "500 Internal server error" },
};

export function handleAPIGatewayError(e: any): APIGatewayProxyResult {
  const defaultError: ErrorResponse = {
    statusCode: 500,
    message: `Error occurred: ${e}`,
  };

  if (e instanceof Error && e.name in errorMap) {
    const { statusCode, message } = errorMap[e.name];
    return createErrorResponse(statusCode, message);
  } else {
    return createErrorResponse(defaultError.statusCode, defaultError.message);
  }
}

function createErrorResponse(
    statusCode: number,
    message: string,
): APIGatewayProxyResult {
  return createErrorResponse(statusCode, message);
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found error");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor() {
    super("Bad request error");
    this.name = "BadRequestError";
  }
}
