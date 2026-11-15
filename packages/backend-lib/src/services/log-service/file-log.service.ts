import path from "path";
import { LogConfig, LogEntry, LogLevel, LogLineFields, LogOptions } from "./types";
import { LogService, LogSnapshot } from "./log.service";
import { resolveDefaultLogFolder } from "./log-path";
import fs from 'node:fs/promises'
import { format } from "date-fns";
import { Queue } from "bullmq";

/** Directories this process already created, so a write doesn't cost a `mkdir` every time. */
const knownDirs = new Set<string>();

export class FileLogService extends LogService {

    constructor(config: LogConfig, queue?: Queue) {

        super(config, queue);
    }

    /**
     * Deferred: the line is queued, not written. Call LogService.flush() to write queued lines.
     *
     * Everything is snapshotted at call time (timestamp, id, channel, operation, request,
     * service, replica): builders mutate shared config, and flush runs later outside the
     * request's AsyncLocalStorage, so a live read would mislabel the line.
     */
    protected log(level: LogLevel, message: string, options?: LogOptions, fields?: LogLineFields): this {
        const snapshot = this.takeSnapshot(fields);
        LogService.trackLog(() => this.writeEntry(level, message, options, fields, snapshot));
        if (level === 'critical') {
            // A critical line must not wait for the next request or job to flush.
            void LogService.flush().catch((error) => console.error('Failed to flush critical log:', error));
        }
        return this;
    }

    private async writeEntry(
        level: LogLevel,
        message: string,
        options: LogOptions | undefined,
        fields: LogLineFields | undefined,
        snapshot: Required<LogSnapshot>,
    ): Promise<void> {
        let entry: LogEntry | null = null;
        try {
            entry = this.buildLogEntry(level, message, options, fields, snapshot);
            const line = this.formatLogEntry(entry);
            const logFile = await this.getLogFile(snapshot.service, snapshot.timestamp);
            // appendFile opens with O_APPEND|O_CREAT, so it creates the file owner-only on first
            // write. No exists-check + `writeFile('')`: every writer of a service shares one
            // file, and a check-then-truncate at the daily rollover erases a line just appended.
            try {
                await fs.appendFile(logFile, line, { mode: 0o600 });
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
                // Retention removes service dirs that emptied out; recreate it once.
                knownDirs.delete(path.dirname(logFile));
                await this.getLogFile(snapshot.service, snapshot.timestamp);
                await fs.appendFile(logFile, line, { mode: 0o600 });
            }
        } catch (error) {
            console.error("ERROR LOGGIN", error);
        }
        // After the append attempt, even a failed one: a full disk must still alert.
        if (entry && level === 'critical') await this.dispatchCritical(entry);
    }

    /** `<logFolder>/<service>/<YYYY-MM-DD>.log`, whatever the channel or operation. */
    private async getLogFile(service: string, timestamp: Date) {
        if (!this.config.logFolder) {
            this.config.logFolder = resolveDefaultLogFolder();
        }
        const logFolder = path.join(this.config.logFolder, service);
        if (!knownDirs.has(logFolder)) {
            // Owner-only: logs carry request context and must not be world-readable on the host.
            // Only applies to directories created here; pre-existing ones keep their mode.
            await fs.mkdir(logFolder, { recursive: true, mode: 0o700 });
            knownDirs.add(logFolder);
        }
        // The call's instant, in local time like the retention cutoff, not the flush's.
        return path.join(logFolder, `${format(timestamp, 'yyyy-MM-dd')}.log`);
    }
}