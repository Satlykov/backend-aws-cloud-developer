import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ImportS3Bucket } from "./utils/importS3Bucket.class";
import { ImportProductsFile } from "./utils/importProductsFile.class";
import { ImportFileParser } from "./utils/importFileParser.class";
import { ApiGateway } from "./utils/apiGateway.class";
import { BUCKET_NAME } from "../models/const";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName: string = BUCKET_NAME;
    const importS3Bucket = new ImportS3Bucket(
      this,
      "ImportS3Bucket",
      bucketName,
    );

    const importProductsFileLambda = new ImportProductsFile(
      this,
      "ImportProductsFile",
      importS3Bucket,
    );

    new ImportFileParser(this, "ImportFileParser", importS3Bucket);

    new ApiGateway(this, "ImportServiceApi", importProductsFileLambda);
  }
}
