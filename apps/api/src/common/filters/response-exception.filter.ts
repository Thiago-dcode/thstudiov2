import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import {
  LANGUAGE_HEADER,
  REQUEST_START_TIME,
  USER_ID_HEADER,
  VALIDATION_ERROR_STATUS,
} from '../utils/constants';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { API_ERRORS_CHANNEL, logConfig } from 'src/config/logging';
import { format } from 'date-fns/format';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  constructor() {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    //This approach of try catch ensures the API returns a JSON response, even if the proper exception filter throws an error
    try {
      let status =
        exception?.code || exception?.statusCode || exception?.status || 500;
      status = !isNaN(status) ? status : 500;
      status = VALIDATION_ERROR_STATUS.includes(status) ? status : 500;
      const message =
        exception?.message ||
        exception?.response?.error ||
        'Internal Server Error';
      const errors = Array.isArray(exception?.response?.message)
        ? exception?.response.message
        : [{ message }];
      const error = {
        status_code: status,
        message,
        errors,
        timestamp: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        path: request.path,
      };
      try {
        // Log the error if LogService is available
        const logService = FactoryLogService.createLogService(
          'file',
          logConfig.api,
        );
        logService.channel(API_ERRORS_CHANNEL + '/' + status).error(message, {
          ...error,
          requestBody: request?.body,
          requestParams: request?.params,
          requestQuery: request?.query,
        });
      } catch (error) {
        console.error('Exception occurred:', error);
      }
      return response.status(status).json({
        error,
        audit: {
          ip: request?.ip,
          user_agent: request?.get('user-agent'),
          request_time:
            (Date.now() - parseInt(request?.headers[REQUEST_START_TIME])) /
            1000,
          language: request?.headers[LANGUAGE_HEADER],
          user: request?.headers[USER_ID_HEADER] || null,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err?.message : 'Internal Server Error';
      const error = {
        status_code: 500,
        message,
        timestamp: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        path: request?.path,
      };
      try {
        // Log the error if LogService is available
        const logService = FactoryLogService.createLogService(
          'file',
          logConfig.api,
        );
        logService
          .channel(API_ERRORS_CHANNEL + '/' + '500')
          .error(message, error);
      } catch (error) {
        console.error('Exception occurred:', error);
      }
      return response.status(500).json({
        error,
      });
    }
  }
}
