import path from "path";
import { LogContext, LogObjectEntry } from "../types";
import fs from 'node:fs/promises'
import { format } from "date-fns";
import { LogDriver } from "./log.driver";
import { resolveDefaultLogFolder } from "../helpers/log-path";

/** Directories this process already created, so a write doesn't cost a `mkdir` every time. */
const knownDirs = new Set<string>();

/** Appends each entry to `<folder>/<entry.service>/<YYYY-MM-DD>.log`. */
export class FileLogDriver<E extends LogObjectEntry> extends LogDriver<E> {
    /**
     * Without a folder it resolves the default on the first write (`LOG_STORAGE_DIR`, else the
     * monorepo's `storage/logs`), so building the driver at import touches nothing.
     */
    constructor(private folder?: string) {
        super()
    }

    async process(logContext: LogContext, entry: E): Promise<void> {
        const line = this.formatLogEntry(logContext.format, entry);
        const logFile = await this.getLogFile(logContext);
        // appendFile opens with O_APPEND|O_CREAT, so it creates the file owner-only on first
        // write. No exists-check + `writeFile('')`: every writer of a service shares one
        // file, and a check-then-truncate at the daily rollover erases a line just appended.
        try {
            await fs.appendFile(logFile, line, { mode: 0o600 });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
            // Retention removes service dirs that emptied out; recreate it once.
            knownDirs.delete(path.dirname(logFile));
            await this.getLogFile(logContext);
            await fs.appendFile(logFile, line, { mode: 0o600 });
        }
    }

    /** `<folder>/<service>/<YYYY-MM-DD>.log`, whatever the channel or operation. */
    private async getLogFile(logContext: LogContext) {
        this.folder ??= resolveDefaultLogFolder();
        const logFolder = path.join(this.folder, logContext.service);
        if (!knownDirs.has(logFolder)) {
            // Owner-only: logs carry request context and must not be world-readable on the host.
            // Only applies to directories created here; pre-existing ones keep their mode.
            await fs.mkdir(logFolder, { recursive: true, mode: 0o700 });
            knownDirs.add(logFolder);
        }
        // The call's instant, in local time like the retention cutoff, not the flush's.
        return path.join(logFolder, `${format(logContext.timestamp, 'yyyy-MM-dd')}.log`);
    }
}
