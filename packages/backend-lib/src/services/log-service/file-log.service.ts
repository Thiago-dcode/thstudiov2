import path from "path";
import { LogConfig, LogLevel, LogOptions } from "./types";
import { LogService } from "./log.service";
import { resolveDefaultLogFolder } from "./log-path";
import fs from 'node:fs/promises'
import { checkFileExistsAsync } from '@repo/backend-lib/utils';
import { format, isSameDay } from "date-fns";
import { Queue } from "bullmq";
export class FileLogService extends LogService {

    constructor(config: LogConfig, queue?: Queue) {

        super(config, queue);
    }

    /**
     * Deferred log methods - they queue the log but do NOT execute it.
     * Call LogService.flush() to execute and write all queued logs.
     *
     * Snapshot name/channel/id at schedule time: `.name()` mutates shared config,
     * and flush runs later — without a snapshot every pending line would land in
     * whichever file name was set last.
     */
    public info(message: string, options?: LogOptions): this {
        return this.trackDeferred('info', message, options);
    }
    public error(message: string, options?: LogOptions): this {
        return this.trackDeferred('error', message, options);
    }
    public warn(message: string, options?: LogOptions): this {
        return this.trackDeferred('warn', message, options);
    }
    public debug(message: string, options?: LogOptions): this {
        return this.trackDeferred('debug', message, options);
    }
    public success(message: string, options?: LogOptions): this {
        return this.trackDeferred('success', message, options);
    }

    private trackDeferred(level: LogLevel, message: string, options?: LogOptions): this {
        const id = this.getLogId();
        const name = this.config.name;
        const channel = this.config.channel;
        LogService.trackLog(() => this.writeLogAsync(level, message, options, id, name, channel));
        return this;
    }

    private async writeLogAsync(
        level: LogLevel,
        message: string,
        options?: LogOptions,
        id?: string | null,
        name?: string,
        channel?: string,
    ): Promise<void> {
        await this.writeLog(await this.getLogFile(name, channel), level, message, options, id, channel);
    }

    private async getLogFile(name = this.config.name, channel = this.config.channel) {
        const now = new Date();
        if (!LogService.date || !isSameDay(now, LogService.date)) {
            LogService.date = now;
        }
        const today = format(LogService.date, 'yyyy-MM-dd');
        if (!this.config.logFolder) {
            this.config.logFolder = resolveDefaultLogFolder();
        }
        const logFolder = path.join(this.config.logFolder as string, channel);
        if (!(await checkFileExistsAsync(logFolder))) {
            // Owner-only: logs carry request context and must not be world-readable on the host.
            // Only applies to directories created here; pre-existing ones keep their mode.
            await fs.mkdir(logFolder, { recursive: true, mode: 0o700 });
        }
        return path.join(logFolder, `${today}${name ? `.${name}` : ''}.log`);
    }

    private async writeLog(logFile: string, level: LogLevel, message: string, options?: LogOptions, id?: string | null, channel?: string) {
        try {
            if (!(await checkFileExistsAsync(logFile))) {
                await fs.writeFile(logFile, '', { mode: 0o600 });
            }
            await fs.appendFile(logFile, this.beautifyLogMessage(level, message, options, id, channel));
            await this.callCallback(level, message, options, channel);
        } catch (error) {
            console.error("ERROR LOGGIN", error);
        }
    }


}