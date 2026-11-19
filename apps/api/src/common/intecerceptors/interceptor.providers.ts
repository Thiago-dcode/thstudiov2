import { Scope } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

const INTERCEPTORS = [ResponseInterceptor] as const;

export const InterceptorProviders = INTERCEPTORS.map((interceptor) => ({
  provide: APP_INTERCEPTOR,
  scope: Scope.REQUEST,
  useClass: interceptor,
}));
