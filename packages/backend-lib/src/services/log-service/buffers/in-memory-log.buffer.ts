import { LogBuffer } from "./log.buffer";
import { LogContext, LogObjectEntry } from "../types";

/**
 * Keeps the pending entries in this process's memory. For tests (the process buffer under Jest)
 * and single-process tools that flush it themselves: no other process ever sees these lines.
 */
export class InMemoryLogBuffer<E extends LogObjectEntry> extends LogBuffer<E> {
    private pendingLogs: ({
        logContext:LogContext,
        entry:E,
    })[] = [];

    add(logContext:LogContext, entry: E): void {
        this.pendingLogs.push({logContext,entry});
    }

    async length(): Promise<number> {
        return this.pendingLogs.length;
    }

    async flush(): Promise<void> {
        // Take the batch first: entries logged while it is being written wait for the next flush.
        const batch = this.pendingLogs.splice(0);
        if (!batch.length) return;
        const run = Promise.all(batch.map(({entry,logContext}) => this.write(logContext,entry)));
        this.track(run);
        await run;
    }
}
