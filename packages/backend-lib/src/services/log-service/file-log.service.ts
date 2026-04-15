import path from "path";
import { LogConfig, LogLevel, LogOptions } from "./types";
import { LogService } from "./log.service";
import fs from 'node:fs/promises'
import { checkFileExistsAsync } from '@repo/backend-lib/utils';
import { differenceInDays, format } from "date-fns";
import { Queue } from "bullmq";
export class FileLogService extends LogService {

    constructor(config: LogConfig, queue?: Queue) {

        super(config, queue);
    }

    /**
     * Deferred log methods - they queue the log but do NOT execute it.
     * Call LogService.flush() to execute and write all queued logs.
     */
    public info(message: string, options?: LogOptions): this {
        const id = this.getLogId();
        LogService.trackLog(() => this.writeLogAsync('info', message, options, id));
        return this;
    }
    public error(message: string, options?: LogOptions): this {
        const id = this.getLogId();
        LogService.trackLog(() => this.writeLogAsync('error', message, options, id));
        return this;
    }
    public warn(message: string, options?: LogOptions): this {
        const id = this.getLogId();
        LogService.trackLog(() => this.writeLogAsync('warn', message, options, id));
        return this;
    }
    public debug(message: string, options?: LogOptions): this {
        const id = this.getLogId();
        LogService.trackLog(() => this.writeLogAsync('debug', message, options, id));
        return this;
    }
    public success(message: string, options?: LogOptions): this {
        const id = this.getLogId();
        LogService.trackLog(() => this.writeLogAsync('success', message, options, id));
        return this;
    }

    private async writeLogAsync(level: LogLevel, message: string, options?: LogOptions, id?: string | null): Promise<void> {
        await this.writeLog(await this.getLogFile(), level, message, options, id);
    }

    private async getLogFile() {
        if (!LogService.date || differenceInDays(new Date(), LogService.date) > 0) {
            LogService.date = new Date();
        }
        const today = format(LogService.date, 'yyyy-MM-dd');
        if (!this.config.logFolder) {
            this.config.logFolder = path.resolve(process.cwd(), '..', '..', 'packages', 'backend-lib', 'storage', 'logs');
        }
        const logFolder = path.join(this.config.logFolder as string, this.config.channel);
        if (!(await checkFileExistsAsync(logFolder))) {
            await fs.mkdir(logFolder, { recursive: true });
        }
        return path.join(logFolder, `${today}${this.config.name ? `.${this.config.name}` : ''}.log`);
    }

    private async writeLog(logFile: string, level: LogLevel, message: string, options?: LogOptions, id?: string | null) {
        try {
            if (!(await checkFileExistsAsync(logFile))) {
                await fs.writeFile(logFile, '');
            }
            await fs.appendFile(logFile, this.beautifyLogMessage(level, message, options, id));
            await this.callCallback(level, message, options);
        } catch (error) {
            console.error("ERROR LOGGIN", error);
        }
    }


}