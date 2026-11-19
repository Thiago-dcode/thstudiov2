import { createHash } from 'node:crypto';
import { config } from '@repo/common-lib/config';
import { JOB_ERROR_500_MAIL } from '@repo/common-lib/constants/queues';
import type { LogCallback, LogEntry } from '../services/log-service/types';
import type { MailJob } from '@repo/common-lib/types/mail';
import { QueueHelper } from './queue-helper';

/** Mails per process per throttle window, across all fingerprints. A burst of distinct failures stops here. */
export const CRITICAL_ALERT_MAX_PER_WINDOW = 10;
const STALE_KEY_CLEANUP_THRESHOLD = 500;

// Per-process first filter, so a burst doesn't cost a Redis round trip per line. The shared
// layer (BullMQ deduplication) is what collapses the same alert across replicas and the worker.
const lastSentAt = new Map<string, number>();
let windowStartedAt = 0;
let sentInWindow = 0;
let capWarned = false;

/**
 * `service` is in it because the api and the worker failing the same way are different problems.
 * The request path and replica are not: a scanner burst hits hundreds of paths with one failure.
 */
function fingerprintOf(entry: LogEntry): string {
    return `${entry.service}|${entry.channel}|${entry.operation ?? ''}|${entry.status_code ?? ''}|${entry.message}`;
}

function isThrottled(fingerprint: string, now: number, throttleMs: number): boolean {
    const sentAt = lastSentAt.get(fingerprint);
    return sentAt !== undefined && now - sentAt < throttleMs;
}

function recordSent(fingerprint: string, now: number, throttleMs: number): void {
    lastSentAt.set(fingerprint, now);
    // Opportunistic cleanup so long-running processes don't accumulate stale keys forever.
    if (lastSentAt.size > STALE_KEY_CLEANUP_THRESHOLD) {
        for (const [key, sentAt] of lastSentAt) {
            if (now - sentAt > throttleMs) lastSentAt.delete(key);
        }
    }
}

/** True when this window already sent the maximum. Counts (reserves) the send otherwise. */
function capReached(now: number, throttleMs: number): boolean {
    if (now - windowStartedAt >= throttleMs) {
        windowStartedAt = now;
        sentInWindow = 0;
        capWarned = false;
    }
    if (sentInWindow >= CRITICAL_ALERT_MAX_PER_WINDOW) {
        if (!capWarned) {
            capWarned = true;
            console.warn(
                `criticalAlertMail: ${CRITICAL_ALERT_MAX_PER_WINDOW} alerts sent this window, suppressing the rest until it ends`,
            );
        }
        return true;
    }
    sentInWindow++;
    return false;
}

/** @internal Clears the per-process throttle state. For tests. */
export function resetCriticalAlertThrottle(): void {
    lastSentAt.clear();
    windowStartedAt = 0;
    sentInWindow = 0;
    capWarned = false;
}

/**
 * One throttled admin alert mail per distinct failure. Used by `emailCritical`, the log callback
 * set in `config/logging.ts`. It gets the redacted entry that went to disk, and never logs through
 * a LogService (no alert recursion).
 */
export const criticalAlertMail: LogCallback = async (entry) => {
    if (!config().app.sendErrorEmails) return;

    const throttleMs = Math.max(0, config().app.errorEmailThrottleMinutes) * 60 * 1000;
    const fingerprint = fingerprintOf(entry);
    // Reserved before the enqueue (so concurrent identical alerts don't both pass) and released if
    // it fails: a failed enqueue sent nothing and must not silence the rest of the window.
    let release: (() => void) | null = null;
    if (throttleMs > 0) {
        const now = Date.now();
        if (isThrottled(fingerprint, now, throttleMs)) {
            console.log(`criticalAlertMail: suppressed duplicate alert within throttle window - "${fingerprint}"`);
            return;
        }
        if (capReached(now, throttleMs)) return;
        const previousSentAt = lastSentAt.get(fingerprint);
        const reservedWindow = windowStartedAt;
        recordSent(fingerprint, now, throttleMs);
        release = () => {
            if (previousSentAt === undefined) lastSentAt.delete(fingerprint);
            else lastSentAt.set(fingerprint, previousSentAt);
            // Only give the cap slot back if the window it was taken from is still the current one.
            if (windowStartedAt === reservedWindow && sentInWindow > 0) sentInWindow--;
        };
    }

    const { service, replica, channel, operation, id, status_code, timestamp, request, extraInfo, message } = entry;
    // Collapsed first: a multi-line error message (stack, SQL) would otherwise break the header.
    const subjectMessage = message.replace(/\s+/g, ' ').trim().slice(0, 80);
    const subject = `CRITICAL [${service}] ${channel}${operation ? '/' + operation : ''}: ${subjectMessage}`;

    const job: MailJob = {
        name: JOB_ERROR_500_MAIL,
        payload: {
            message,
            subject,
            // app_url identifies which environment (prod/dev) sent the alert; the mail lists every option key.
            options: {
                service,
                replica,
                channel,
                operation,
                id,
                status_code,
                timestamp,
                request,
                extraInfo,
                app_url: config().app.url,
            },
        },
    };

    try {
        if (throttleMs > 0) {
            await QueueHelper.createMailJob(job, {
                // Shared across replicas and the worker: the same alert inside the window adds no job.
                deduplication: {
                    id: `critical-alert:${createHash('sha1').update(fingerprint).digest('hex')}`,
                    ttl: throttleMs,
                },
            }, { id: entry.id });
        } else {
            // The alert mail job keeps the critical line's trace id.
            await QueueHelper.createMailJob(job, undefined, { id: entry.id });
        }
    } catch (error) {
        release?.();
        // Swallow: a failed alert must never bubble up and re-trigger a critical line.
        console.error('criticalAlertMail: failed to enqueue the alert mail', error);
    }
};
