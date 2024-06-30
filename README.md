# Nodejs-aws-shop-backend
This repo is a backend for [nodejs-aws-cdk-starter](https://github.com/Satlykov/nodejs-aws-cdk-starter) (frontend)

It uses the following technologies:

- [AWS CDK](https://docs.aws.amazon.com/cdk/api/v2/) – an open-source software development framework for defining cloud infrastructure in
  code and provisioning it through AWS CloudFormation
- [TypeScript](https://www.typescriptlang.org/) as a type checking tool
- [Jest](https://jestjs.io) as a main test runner


## Main Useful Scripts
- build the project locally
```shell
npm run build
```
- deploy the project to AWS API Gateway
```shell
npm run cdk:deploy
```
- test the project (e.g., Lambda functions, Service stack, etc.)
```shell
npm run test
```
