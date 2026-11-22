import { LogContext, LogObjectEntry } from "../types";
import { LogDriver } from "../drivers/log.driver";

/**
 * Holds pending entries until the worker's scheduled flush (`JOB_FLUSH_LOGS`, every 5 s)
 * hands each one to its driver. One per process: `logBuffer` in `config/logging.ts`.
 *
 * It also tracks in-flight work (pushes, callbacks such as the critical mail). A process never
 * flushes: it `settle()`s before exit, so nothing it started is lost.
 */
export abstract class LogBuffer<E extends LogObjectEntry = {}> {
    /** Pushes, flushes and callbacks running right now. Read only by `settle()`. */
    private inFlight = new Set<Promise<void>>();

    constructor(protected readonly logDriver: LogDriver<E>) { }

    /** Queues an entry for the next `flush()`. Never throws, never waits. */
    abstract add(logContext: LogContext, entry: E): void;

    /** Entries waiting for a flush. */
    abstract length(): Promise<number>;

    /** Takes every pending entry, writes them all through the driver and waits for them. */
    abstract flush(): Promise<void>;

    /** Remembers running work (a push, a callback) so `settle()` can wait for it. */
    track(work: Promise<unknown>): void {
        const settled = work.then(() => undefined, () => undefined);
        this.inFlight.add(settled);
        void settled.then(() => this.inFlight.delete(settled));
    }

    /**
     * Waits for every tracked push and callback, including ones tracked while it waits. Use
     * before `process.exit`. Never flushes, never rejects.
     */
    async settle(): Promise<void> {
        while (this.inFlight.size) {
            await Promise.all([...this.inFlight]);
        }
    }

    /** One entry through the driver. A failed write is reported, never thrown: one bad line must not sink a batch. */
    protected async write(logContext: LogContext, entry: E): Promise<void> {
        try {
            await this.logDriver.process(logContext, entry);
        } catch (error) {
            console.error('LogBuffer: failed to write a log line', error);
        }
    }
}
