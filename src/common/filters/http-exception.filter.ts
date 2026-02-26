import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Determinar el código de estado (400, 404, 500...)
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // 2. Extraer el mensaje de error
    // Si es de class-validator, el mensaje suele venir en un array dentro de 'message'
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const resContent = exception.getResponse();
      message = typeof resContent === 'object'
        ? (resContent as any).message || exception.message
        : resContent;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 3. Formatear la respuesta final
    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message[0] : message, // Tomamos el primer error de validación si hay varios
      data: null,
    });
  }
}