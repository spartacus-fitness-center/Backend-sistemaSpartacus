import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. Verificar si el endpoint tiene el decorador @NoStandardResponse
    const isIgnored = this.reflector.getAllAndOverride<boolean>('isPublicResponse', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isIgnored) return next.handle();

    // 2. Obtener el mensaje del decorador @ResponseMessage
    const message = this.reflector.get<string>('response_message', context.getHandler()) || 'Operación exitosa';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: message,
        data: data,
      })),
    );
  }
}