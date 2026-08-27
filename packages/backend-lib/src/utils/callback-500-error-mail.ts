import { config } from '@repo/common-lib/config';
import { JOB_ERROR_500_MAIL } from '@repo/common-lib/constants/queues';
import {
  LogLevel,
  LogOptions,
} from '../services/log-service/types';
import { QueueHelper } from './queue-helper';

// In-memory dedupe store for `callback500ErrorMail`. Keyed by error message + request
// path, value is the timestamp of the last email sent for that key. Since every 500
// response (webhook errors, subscription errors, API request errors, etc.) funnels
// through this same static method, this is a single choke point to stop the same bug
// (e.g. a missing DB column hit on every landing-page visit) from emailing admins once
// per request.
const recentErrorEmailSentAt = new Map<string, number>();

/** Returns true if an email for `key` was already sent within `throttleMs`, and records this send otherwise. */
function shouldThrottleErrorEmail(key: string, throttleMs: number): boolean {
  const now = Date.now();
  const lastSentAt = recentErrorEmailSentAt.get(key);
  if (lastSentAt !== undefined && now - lastSentAt < throttleMs) {
    return true;
  }
  recentErrorEmailSentAt.set(key, now);
  // Opportunistic cleanup so long-running processes don't accumulate stale keys forever.
  if (recentErrorEmailSentAt.size > 500) {
    for (const [staleKey, sentAt] of recentErrorEmailSentAt) {
      if (now - sentAt > throttleMs) recentErrorEmailSentAt.delete(staleKey);
    }
  }
  return false;
}

export async function callback500ErrorMail(
  level: LogLevel,
  message: string,
  options?: LogOptions,
) {

  //Send a email to admin emails
  console.log('CALLBACK CALLED FOR ERROR 500', level, message);
  if (!config().app.sendErrorEmails) return;

  const throttleMinutes = config().app.errorEmailThrottleMinutes;
  if (throttleMinutes > 0) {
    const dedupeKey = `${message}::${options?.path ?? ''}`;
    if (shouldThrottleErrorEmail(dedupeKey, throttleMinutes * 60 * 1000)) {
      console.log(`callback500ErrorMail: suppressed duplicate 500 alert email within throttle window - "${dedupeKey}"`);
      return;
    }
  }

  try {
    await QueueHelper.createMailJob({
      name: JOB_ERROR_500_MAIL,
      payload: { message, options },
    });
  } catch (error) {
    // Swallow: a failed error-alert email must never bubble up and re-trigger this callback.
    console.error('callback500ErrorMail: failed to send 500 alert email', error);
  }
}
