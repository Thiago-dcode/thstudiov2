import { LogBuffer } from "./log.buffer";
import { LogEntry } from "../types";

/**
 * Keeps the pending entries in this process's memory. For tests (the process buffer under Jest)
 * and single-process tools that flush it themselves: no other process ever sees these lines.
 */
export class InMemoryLogBuffer extends LogBuffer {
    private pendingLogs: LogEntry[] = [];

    add(entry: LogEntry): void {
        this.pendingLogs.push(entry);
    }

    async length(): Promise<number> {
        return this.pendingLogs.length;
    }

    async flush(): Promise<void> {
        // Take the batch first: entries logged while it is being written wait for the next flush.
        const batch = this.pendingLogs.splice(0);
        if (!batch.length) return;
        const run = Promise.all(batch.map((entry) => this.write(entry)));
        this.track(run);
        await run;
    }
}
