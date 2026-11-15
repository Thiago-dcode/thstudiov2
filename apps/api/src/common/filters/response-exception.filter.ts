import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { LANGUAGE_HEADER } from '@repo/common-lib/constants/language';
import {
  IP_ADDRESS_HEADER,
  REQUEST_START_TIME,
  USER_AGENT_HEADER,
  USER_ID_HEADER,
} from '@repo/common-lib/constants/headers';
import {
  FactoryLogService,
  LogService,
  maskEmailAddresses,
  redactRoutePath,
} from '@repo/backend-lib/services/log-service';
import { API_ERROR_CHANNEL, logConfig } from '@repo/backend-lib/config/logging';
import { format } from 'date-fns/format';
import { VALIDATION_ERROR_STATUS } from '../utils/constants';
import { Error as ApiError, ErrorResponse } from '@repo/common-lib/types/response';
import { ApiException } from '../exceptions/api-exception';
import { RequestService } from '../services/request.service';

const EMAIL_KEY = /e[-_]?mail/i;
const MAX_LOGGED_DEPTH = 8;

/**
 * Drops email-like keys and redacts address-carrying strings at any depth (log copy only). Uses
 * the shared address pattern, so `photo@2x.png` or a package path is not mistaken for one.
 */
const withoutEmails = (input: unknown, depth = 0): unknown => {
  if (typeof input === 'string') return maskEmailAddresses(input) !== input ? '[REDACTED]' : input;
  if (!input || typeof input !== 'object' || depth >= MAX_LOGGED_DEPTH) return input;
  if (Array.isArray(input)) return input.map((item) => withoutEmails(item, depth + 1));
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([key]) => !EMAIL_KEY.test(key))
      .map(([key, value]) => [key, withoutEmails(value, depth + 1)]),
  );
};

/**
 * The logged copy of a request's body/params/query. `code` is the client's one-time code (password
 * recovery, email verification): a live secret the log redactor deliberately lets through. Emails
 * are dropped outright, not masked: the request id and `request.user_id` identify the caller, and
 * an address (even masked) is PII on disk and in the admin alert mail.
 */
const withoutClientCode = (input: unknown): unknown => {
  const scrubbed = withoutEmails(input);
  if (!scrubbed || typeof scrubbed !== 'object' || Array.isArray(scrubbed) || !('code' in scrubbed)) return scrubbed;
  return { ...(scrubbed as Record<string, unknown>), code: '[REDACTED]' };
};

/** `Cannot GET /x?token=abc` -> `Cannot GET /x`. */
const withoutQueryString = (text: string): string =>
  typeof text === 'string' ? text.replace(/\?\S*/g, '') : text;

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  constructor(private readonly requestService: RequestService) { }

  /**
   * The path for the log line only (the client still gets `request.path`). A raw path can carry a
   * secret param (`/email-preferences/:token/token`), so it is masked the same way as
   * `request.path` in the log context: never the raw value when the route has sensitive params,
   * and `null` when no route matched.
   */
  private loggedPath(input: unknown): string | null {
    try {
      const request = input as
        | { path?: unknown; route?: { path?: string }; params?: Record<string, unknown> }
        | undefined;
      return (
        this.requestService.path ??
        redactRoutePath(
          typeof request?.path === 'string' ? request.path : '',
          request?.route?.path,
          request?.params,
        )
      );
    } catch {
      return null;
    }
  }
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
      const api_error_code = exception instanceof ApiException ? exception.API_ERROR_CODE : undefined;
      const message: string =
        typeof exception?.message === 'string'
          ? exception?.message
          : typeof exception?.response?.error === 'string'
            ? exception?.response?.error
            : 'Internal Server Error';
      const errors: string[] = Array.isArray(exception?.response?.message)
        ? exception?.response.message
        : [message];
      const error: ApiError = {
        api_error_code,
        status_code: status,
        message,
        errors,
        path: request.path,
      };
      try {
        // Log the error if LogService is available. The request binding gives this line the same
        // `id`/`request` as the request's other lines and its `api.access` line. The channel goes in
        // the config: the channel builder would mutate the instance.
        const logService = FactoryLogService.createLogService(
          'file',
          { ...logConfig.api, ...this.requestService.logBinding(), channel: API_ERROR_CHANNEL },
        );
        // Nest's unknown-route 404 says `Cannot GET <originalUrl>`, query string included, and a
        // query can carry a one-time token. Any message can also quote a submitted address
        // ("Email ross@example.com is taken"). The client still gets the original message.
        const toLogged = (text: string) =>
          maskEmailAddresses(status === 404 ? withoutQueryString(text) : text);
        const logMessage = toLogged(message);
        const context = {
          ...error,
          path: this.loggedPath(request),
          message: logMessage,
          errors: errors.map((entry) => (typeof entry === 'string' ? toLogged(entry) : entry)),
          // A 404 body is whatever an unknown caller posted to a route that does not exist:
          // nothing to debug, and it puts arbitrary attacker content on disk.
          requestBody: status === 404 ? undefined : withoutClientCode(request?.body),
          requestParams: withoutClientCode(request?.params),
          requestQuery: withoutClientCode(request?.query),
        };
        // 4xx is the client's mistake, not ours: keep it out of ERROR so real failures stand out.
        // Every 5xx is CRITICAL, which sends the (throttled) admin alert mail.
        if (status < 500) logService.warn(logMessage, context, { status_code: status });
        else logService.critical(logMessage, context, { status_code: status });
        void LogService.flush().catch((flushErr) =>
          console.error('Failed to flush error logs:', flushErr),
        );
      } catch (error) {
        console.error('Exception occurred:', error);
      }

      const requestStartTime = parseInt(
        request?.headers[REQUEST_START_TIME] || '0',
      );
      // An unexpected error (not an HttpException we threw on purpose) can carry SQL, driver or
      // file-system detail in its message: the log above keeps it, the client gets a generic one.
      const isUnexpected = status === 500 && !(exception instanceof HttpException);
      const responseError: ErrorResponse = {
        data: null,
        error: isUnexpected
          ? { ...error, message: 'Internal Server Error', errors: ['Internal Server Error'] }
          : error,
        audit: {
          ip:
            request?.get?.(IP_ADDRESS_HEADER) ||
            request?.ip ||
            request?.get?.('x-forwarded-for') ||
            '-',
          user_agent:
            request?.get?.(USER_AGENT_HEADER) ||
            request?.get?.('user-agent') ||
            '-',
          request_time: !isNaN(requestStartTime)
            ? (Date.now() - requestStartTime) / 1000
            : 0,
          language: request?.headers[LANGUAGE_HEADER],
          user: request?.headers[USER_ID_HEADER] || null,
        },
      };
      return response.status(status).json(responseError);
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
          { ...logConfig.api, ...this.requestService.logBinding(), channel: API_ERROR_CHANNEL },
        );
        logService.critical(
          maskEmailAddresses(message),
          { ...error, message: maskEmailAddresses(message), path: this.loggedPath(request) },
          { status_code: 500 },
        );
        void LogService.flush().catch((flushErr) =>
          console.error('Failed to flush error logs:', flushErr),
        );
      } catch (error) {
        console.error('Exception occurred:', error);
      }
      return response.status(500).json({
        error,
      });
    }
  }
}
