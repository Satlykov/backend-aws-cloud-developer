import {
    All,
    Controller,
    Get,
    HttpStatus,
    Param,
    Req,
    Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get(['', 'ping'])
    healthCheck(): any {
        return {
            statusCode: HttpStatus.OK,
            message: 'OK',
        };
    }

    @All(['/:recipientServiceName', '/:recipientServiceName/*'])
    async handleRequest(
        @Req() request: Request,
        @Res() response: Response,
        @Param('recipientServiceName') recipientServiceName: string
    ) {
        const recipientServiceResponse =
            await this.appService.getRecipientServiceResponse(
                recipientServiceName,
                request
            );

        return response
            .set(recipientServiceResponse.headers)
            .status(recipientServiceResponse.status)
            .send(recipientServiceResponse.data);
    }
}
