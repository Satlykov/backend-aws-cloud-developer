import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { APIGatewayProxyResult, S3Event } from "aws-lambda";
import * as csvParser from "csv-parser";
import { ProductWithStockType } from "../models/productWithStock.interface";
import { Readable } from "stream";
import { handleAPIGatewayError } from "./errorHandler";
import { createResponse } from "../utils/create-response";

const s3Client: S3Client = new S3Client({});

const parseCSV = (stream: Readable): Promise<ProductWithStockType[]> => {
  return new Promise((resolve, reject): void => {
    const products: ProductWithStockType[] = [];
    stream
      .pipe(csvParser({ separator: ";" }))
      .on("data", (data): void => {
        products.push(data);
        console.log(data);
      })
      .on("end", () => resolve(products))
      .on("error", reject);
  });
};

const getObject = async (bucket: string, key: string) => {
  const command: GetObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return s3Client.send(command);
};

const copyObject = async (bucket: string, key: string, newKey: string) => {
  const command: CopyObjectCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${key}`,
    Key: newKey,
  });
  return s3Client.send(command);
};

const deleteObject = async (bucket: string, key: string) => {
  const command: DeleteObjectCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return s3Client.send(command);
};

export const handler = async (
  event: S3Event,
): Promise<APIGatewayProxyResult> => {
  console.log("request", JSON.stringify(event));

  for (const record of event.Records) {
    const bucket: string = record.s3.bucket.name;
    const key: string = record.s3.object.key;

    console.log("Bucket:", bucket);
    console.log("Object key:", key);

    try {
      const result: GetObjectCommandOutput = await getObject(bucket, key);

      if (!result.Body) {
        throw new Error("Body is undefined");
      }

      const readableStream: Readable = result.Body as Readable;
      const productsFromCSV: ProductWithStockType[] =
        await parseCSV(readableStream);

      console.log(productsFromCSV);

      const newKey: string = key.replace("uploaded", "parsed");
      console.log("newKey:", newKey);

      await copyObject(bucket, key, newKey);
      console.log("File copied from uploaded to parsed");

      await deleteObject(bucket, key);
      console.log("File deleted from uploaded");
      console.log(`Object ${key} was successfully moved to parsed folder`);
    } catch (error) {
      console.error("Error processing object from S3:", error);
      return handleAPIGatewayError(error);
    }
  }

  return createResponse(200, { message: "Processing completed successfully" });
};
