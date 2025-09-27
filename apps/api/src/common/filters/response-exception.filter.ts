import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import {
  LANGUAGE_HEADER,
  REQUEST_START_TIME,
  USER_ID_HEADER,
} from '../utils/constants';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { logConfig } from 'src/config/logging';
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
      const status =
        exception?.code || exception?.statusCode || exception?.status || 500;
      const message = exception?.message || 'Internal Server Error';
      const error = {
        status_code: status,
        message,
        timestamp: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        path: request.path,
      };
      try {
        // Log the error if LogService is available
        const logService = FactoryLogService.createLogService(
          'file',
          logConfig.api);
        logService.channel('api/errors/' + status).error(message, error);
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
        logService.channel('api/errors/' + 500).error(message, error);
      } catch (error) {
        console.error('Exception occurred:', error);
      }
      return response.status(500).json({
        error,
      });
    }
  }
}
