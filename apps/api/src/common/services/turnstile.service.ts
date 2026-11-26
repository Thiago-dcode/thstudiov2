import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { isIP } from 'net';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import {
  TURNSTILE_SITEVERIFY_URL,
  TURNSTILE_TEST_KEYS,
  TURNSTILE_TEST_SECRET_KEY,
  TURNSTILE_TOKEN_MAX_LENGTH,
  TurnstileAction,
} from '@repo/common-lib/constants/turnstile';
import { ApiException } from 'src/common/exceptions/api-exception';
import { ApiLogger, apiLogger, RequestService } from './request.service';

/** Per-attempt Siteverify timeout. */
const SITEVERIFY_TIMEOUT_MS = 4000;
/** The first call plus one retry, both with the same `idempotency_key` so the retry never burns the token. */
const SITEVERIFY_MAX_ATTEMPTS = 2;
/** Siteverify error codes caused by our configuration, not by the visitor. */
const CONFIG_FAULT_CODES: ReadonlySet<string> = new Set(['missing-input-secret', 'invalid-input-secret', 'bad-request']);
/** A Cloudflare-side failure worth one retry. */
const INTERNAL_ERROR_CODE = 'internal-error';
const MAX_LOGGED_HOSTNAME = 253;
const MAX_LOGGED_ACTION = 32;

const FAILED_MESSAGE = 'Verification failed, please try again';
const UNAVAILABLE_MESSAGE = 'Verification is temporarily unavailable, please try again in a moment';

/** The Siteverify answer (api-only, only the fields we read). */
type SiteverifyResponse = {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
  metadata?: { result_with_testing_key?: boolean };
};

export type TurnstileConfigInput = {
  isProduction: boolean;
  secretKey: string;
  siteKey: string;
  appUrl: string | undefined;
};

export type ResolvedTurnstileConfig = {
  secretKey: string;
  expectedHostname: string;
  /** True when no secret was configured and the always-pass test secret is used (never in production). */
  usingTestKey: boolean;
};

const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]']);

/** `APP_URL`'s hostname, or `''` when it is unset or not a URL. */
function hostnameOf(appUrl: string | undefined): string {
  if (!appUrl) return '';
  try {
    return new URL(appUrl).hostname;
  } catch {
    return '';
  }
}

/**
 * Validates the Turnstile config. In production the api refuses to boot with a missing, blank or
 * Cloudflare test key, or an `APP_URL` without a real hostname. Outside production a missing
 * secret falls back to the always-pass test secret. Error messages name the variable, never its value.
 */
export function resolveTurnstileConfig({ isProduction, secretKey, siteKey, appUrl }: TurnstileConfigInput): ResolvedTurnstileConfig {
  const secret = secretKey?.trim() ?? '';
  const site = siteKey?.trim() ?? '';
  const hostname = hostnameOf(appUrl);

  if (isProduction) {
    if (!secret) throw new Error('TURNSTILE_SECRET_KEY must be set in production');
    if (!site) throw new Error('TURNSTILE_SITE_KEY must be set in production');
    if (TURNSTILE_TEST_KEYS.has(secret)) throw new Error('TURNSTILE_SECRET_KEY must not be a Cloudflare test key in production');
    if (TURNSTILE_TEST_KEYS.has(site)) throw new Error('TURNSTILE_SITE_KEY must not be a Cloudflare test key in production');
    if (!hostname || LOCAL_HOSTNAMES.has(hostname)) {
      throw new Error('APP_URL must be a valid public URL for the Turnstile hostname check in production');
    }
    return { secretKey: secret, expectedHostname: hostname, usingTestKey: false };
  }

  return {
    secretKey: secret || TURNSTILE_TEST_SECRET_KEY,
    // Only matters locally with real keys (test-key results skip the hostname check).
    expectedHostname: hostname || 'localhost',
    usingTestKey: !secret,
  };
}

/** Why one Siteverify attempt could not produce an answer (retried once). */
type TransportFailure = { error_name: string; http_status?: number };

/**
 * Server-side Cloudflare Turnstile verification (Siteverify). In production it fails closed: a missing
 * or rejected token is a 403 `TURNSTILE_FAILED`; Siteverify unreachable after one retry, a config fault
 * or a testing-key result is a 503 `TURNSTILE_UNAVAILABLE`. Outside production a missing secret falls
 * back to the always-pass test key (warned at boot), and a testing-key result is accepted. Used by `TurnstileGuard`.
 */
@Injectable()
export class TurnstileService implements OnModuleInit {
  private readonly log: ApiLogger;
  private config: ResolvedTurnstileConfig | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly requestService: RequestService,
  ) {
    this.log = this.requestService.log('auth', { operation: 'turnstile-verify' });
  }

  onModuleInit() {
    const isProduction = this.configService.get<boolean>('app.isProduction') === true;
    this.config = resolveTurnstileConfig({
      isProduction,
      secretKey: this.configService.get<string>('turnstile.secretKey') ?? '',
      siteKey: this.configService.get<string>('turnstile.siteKey') ?? '',
      appUrl: this.configService.get<string>('app.url'),
    });
    if (this.config.usingTestKey) {
      apiLogger('api.bootstrap').warn('Turnstile secret not set, using the always-pass test key');
    }
  }

  /** Resolves when `token` is a fresh, valid Turnstile token for `action`; throws an `ApiException` otherwise. */
  async verify(token: unknown, action: TurnstileAction): Promise<void> {
    // Fails closed (plain Error, not a 403) when verify runs before onModuleInit.
    const config = this.getConfig();
    if (typeof token !== 'string' || token.trim().length === 0 || token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
      // No line: the exception filter's warn covers a missing token.
      throw this.failed();
    }

    const body = new URLSearchParams({
      secret: config.secretKey,
      response: token,
      idempotency_key: randomUUID(),
    });
    const remoteip = this.remoteIp();
    if (remoteip) body.set('remoteip', remoteip);

    let result: SiteverifyResponse | null = null;
    let lastFailure: TransportFailure = { error_name: 'unknown' };
    for (let attempt = 1; attempt <= SITEVERIFY_MAX_ATTEMPTS && !result; attempt++) {
      const outcome = await this.callSiteverify(body);
      if ('failure' in outcome) lastFailure = outcome.failure;
      else result = outcome.result;
    }

    if (!result) {
      this.log.error('Turnstile siteverify unavailable', {
        step: 'siteverify',
        ...lastFailure,
        attempts: SITEVERIFY_MAX_ATTEMPTS,
        turnstile_action: action,
      });
      throw this.unavailable();
    }

    const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'].map(String) : [];

    if (result.success !== true) {
      if (errorCodes.some((code) => CONFIG_FAULT_CODES.has(code))) {
        this.log.error('Turnstile siteverify misconfigured', {
          reason: 'siteverify-misconfigured',
          error_codes: errorCodes,
          turnstile_action: action,
        });
        throw this.unavailable();
      }
      this.log.warn('Turnstile verification rejected', {
        reason: 'siteverify-failed',
        error_codes: errorCodes,
        turnstile_action: action,
      });
      throw this.failed();
    }

    if (result.metadata?.result_with_testing_key === true) {
      // Outside production the test key is the expected answer, so accept it.
      if (this.configService.get<boolean>('app.isProduction') !== true) return;
      // Production can't normally get here (the boot check refuses test keys), so a test-key answer is an alert.
      this.log.critical('Turnstile testing-key result in production', { turnstile_action: action });
      throw this.unavailable();
    }

    if (result.hostname !== config.expectedHostname) {
      this.log.warn('Turnstile verification rejected', {
        reason: 'hostname-mismatch',
        received_hostname: String(result.hostname ?? '').slice(0, MAX_LOGGED_HOSTNAME),
        turnstile_action: action,
      });
      throw this.failed();
    }

    if (result.action !== action) {
      this.log.warn('Turnstile verification rejected', {
        reason: 'action-mismatch',
        received_action: String(result.action ?? '').slice(0, MAX_LOGGED_ACTION),
        turnstile_action: action,
      });
      throw this.failed();
    }
  }

  /** One Siteverify call: an answer to classify, or a transport failure worth the retry. */
  private async callSiteverify(body: URLSearchParams): Promise<{ result: SiteverifyResponse } | { failure: TransportFailure }> {
    let response: Response;
    try {
      response = await fetch(TURNSTILE_SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      });
    } catch (error) {
      return { failure: { error_name: error instanceof Error ? error.name : typeof error } };
    }

    if (response.status >= 500) {
      return { failure: { error_name: 'HttpError', http_status: response.status } };
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch (error) {
      return { failure: { error_name: error instanceof Error ? error.name : 'InvalidJson', http_status: response.status } };
    }
    if (!parsed || typeof parsed !== 'object' || typeof (parsed as SiteverifyResponse).success !== 'boolean') {
      return { failure: { error_name: 'InvalidResponse', http_status: response.status } };
    }

    const result = parsed as SiteverifyResponse;
    if (Array.isArray(result['error-codes']) && result['error-codes'].includes(INTERNAL_ERROR_CODE)) {
      return { failure: { error_name: 'SiteverifyInternalError', http_status: response.status } };
    }
    return { result };
  }

  /**
   * The visitor's IP for `remoteip`: the first entry of the trusted `ip_address` (resolved by
   * `RequestMiddleware`), only when it is a valid IP. Never logged.
   */
  private remoteIp(): string | null {
    const first = this.requestService.ip_address?.split(',')[0]?.trim();
    return first && isIP(first) !== 0 ? first : null;
  }

  private getConfig(): ResolvedTurnstileConfig {
    if (!this.config) {
      throw new Error('TurnstileService used before onModuleInit');
    }
    return this.config;
  }

  private failed(): ApiException {
    return new ApiException(API_ERRORS.TURNSTILE_FAILED, FAILED_MESSAGE, HttpStatus.FORBIDDEN);
  }

  private unavailable(): ApiException {
    return new ApiException(API_ERRORS.TURNSTILE_UNAVAILABLE, UNAVAILABLE_MESSAGE, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
