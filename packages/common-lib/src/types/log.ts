import { LOG_CHANNELS, LOG_SERVICES } from "../constants/log";
import type { RequestLogContext } from "./request";

export type LogServiceType = (typeof LOG_SERVICES)[number];
/** One of `LOG_CHANNELS` (`constants/log.ts`): a closed set, so it is safe as a Loki label. */
export type LogChannel = (typeof LOG_CHANNELS)[number];

/** The level as written in a line (a Loki label). */
export type LogLevelLabel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'SUCCESS' | 'CRITICAL';

/** api: the HTTP request. */
export type ApiLogContext = RequestLogContext;

/**
 * worker: the BullMQ job, built from an allow-list. The trace id is the line's top-level `id`, and
 * the payload (`job.data`) is never included.
 */
export type JobLogContext = {
    queue: string;
    job_name: string;
    job_id: string | null;
    attempt: number;
    max_attempts: number;
};

/**
 * web: the server action or route. `route` is the route pattern as written in the app dir
 * (`/api/oauth2/[provider]/callback`), never the requested URL or its query string.
 */
export type WebLogContext =
    | { kind: 'action' }
    | { kind: 'route'; method: string; route: string };

/** dbcli: the command. The run id is the line's `id`. */
export type DbcliLogContext = { command: string };

/** What `request` may hold in a written line: the context of whichever service wrote it. */
export type RequestContext = ApiLogContext | JobLogContext | WebLogContext | DbcliLogContext;

/** One written log line, except `format`, which comes from the LogService's own entry type. */
export type AppBaseLogEntry = {
    timestamp: string;
    level: LogLevelLabel;
    service: string;
    channel: LogChannel;
    operation: string | null;
    id: string;
    message: string;
    /** Low-cardinality "how" of the line (login method, provider): promoted to a Loki label by Alloy. */
    method?: string;
    status_code?: number;
    replica: string;
    request?: RequestContext;
    extraInfo?: unknown;
};
