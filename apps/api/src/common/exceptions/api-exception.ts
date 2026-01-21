import { HttpException, HttpStatus } from '@nestjs/common';
import { API_ERRORS, ApiErrorKey } from '@repo/common-lib/constants/api-errors';

export class ApiException extends HttpException {
  public readonly API_ERROR_CODE: ApiErrorKey;

  constructor(
    errorCode: ApiErrorKey,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        statusCode,
        errorCode,
        message,
      },
      statusCode,
    );
    this.API_ERROR_CODE = errorCode;
  }

  static mediaSize(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_MEDIA_SIZE_EXCEEDED, message);
  }

  static dailyStorageRequests(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_DAILY_STORAGE_REQUESTS_EXCEEDED, message);
  }

  static compressionNotAllowed(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_COMPRESSION_NOT_ALLOWED, message);
  }

  static maxProjects(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_MAX_PROJECTS_EXCEEDED, message);
  }

  static maxPortfolios(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_MAX_PORTFOLIOS_EXCEEDED, message);
  }

  static maxClients(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_MAX_CLIENTS_EXCEEDED, message);
  }

  static maxServices(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_MAX_SERVICES_EXCEEDED, message);
  }

  static aiCredits(message: string) {
    return new ApiException(API_ERRORS.USER_LIMITS_AI_CREDITS_EXCEEDED, message);
  }
}