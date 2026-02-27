import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === 'object') {
        const r = res as any;

        if (Array.isArray(r.message)) {
          errors = r.message;
          message = 'Validation failed';
        } else {
          message = r.message || exception.message;
        }
      } else {
        message = res;
      }
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      errors
    });
  }
}