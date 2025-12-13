import path from "path";
import { LogConfig, LogLevel, LogOptions } from "./types";
import { LogService } from "./log.service";
import fs from 'node:fs/promises'
import {checkFileExistsAsync} from '@repo/backend-lib/utils';
import { differenceInDays ,format} from "date-fns";
export class FileLogService extends LogService {

    constructor(config: LogConfig) {
       
        super(config);
    }

    /**
     * Fire-and-forget log methods - they queue the log and return immediately.
     * Use LogService.flush() before process exit to ensure all logs are written.
     */
    public info(message: string, options?:LogOptions): this {
       LogService.trackLog(this.writeLogAsync('info', message, options));
       return this;
    }
    public error(message: string, options?:LogOptions): this {
        LogService.trackLog(this.writeLogAsync('error', message, options));
        return this;
    }
    public warn(message: string, options?:LogOptions): this {
        LogService.trackLog(this.writeLogAsync('warn', message, options));
        return this;
    }
    public debug(message: string, options?:LogOptions): this {
        LogService.trackLog(this.writeLogAsync('debug', message, options));
        return this;
    }
    public success(message: string, options?:LogOptions): this {
        LogService.trackLog(this.writeLogAsync('success', message, options));
        return this;
    }

    private async writeLogAsync(level: LogLevel, message: string, options?: LogOptions): Promise<void> {
        await this.writeLog(await this.getLogFile(), level, message, options);
    }

    private async getLogFile() {
        if(!LogService.date || differenceInDays(new Date(), LogService.date) > 0){
            LogService.date = new Date();
        }
        const today = format(LogService.date, 'dd-MM-yyyy');
        if(!this.config.logFolder){
            this.config.logFolder =  path.resolve(process.cwd(), '..','..', 'packages','backend-lib', 'storage', 'logs');
        }
        const logFolder = path.join(this.config.logFolder as string, this.config.channel);
        if(! (await checkFileExistsAsync(logFolder))){
           await fs.mkdir(logFolder, { recursive: true });
        }
       return path.join(logFolder, `${today}${this.config.name ? `.${this.config.name}` : ''}.log`);
    }

    private async writeLog(logFile: string, level: LogLevel, message: string, options?:LogOptions) {
      try {
        if(!(await checkFileExistsAsync(logFile))){
            await fs.writeFile(logFile, '');
            }
            await fs.appendFile(logFile, this.beautifyLogMessage(level, message, options));
            await this.callCallback(level, message, options);
      } catch (error) {
        console.error("ERROR LOGGIN",error);
        }
    }

    
}