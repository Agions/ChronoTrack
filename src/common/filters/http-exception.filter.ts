import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    let message: string;
    let errors: any;

    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (typeof errorResponse === 'object') {
      message = (errorResponse as any).message || '请求失败';
      errors = (errorResponse as any).errors;
    } else {
      message = '请求失败';
    }

    const responseBody = {
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(errors && { errors }),
    };

    this.logger.error(
      `路径: ${request.url} - 方法: ${request.method} - 状态码: ${status} - 错误: ${message}`,
    );

    response.status(status).json(responseBody);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = '服务器内部错误';
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'object'
        ? (errorResponse as any).message || message
        : errorResponse as string;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `路径: ${request.url} - 方法: ${request.method} - 状态码: ${status} - 错误: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
} 