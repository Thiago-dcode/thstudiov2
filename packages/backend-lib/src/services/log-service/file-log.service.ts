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
    public  async info(message: string, options?:LogOptions) {
       await this.writeLog(await this.getLogFile(), 'info', message, options);
    }
    public  async error(message: string, options?:LogOptions) {
        await this.writeLog(await this.getLogFile(), 'error', message, options);
    }
    public  async warn(message: string, options?:LogOptions) {
        await this.writeLog(await this.getLogFile(), 'warn', message, options);
    }
    public  async debug(message: string, options?:LogOptions) {
        await this.writeLog(await this.getLogFile(), 'debug', message, options);
    }
    public  async success(message: string, options?:LogOptions) {
        await this.writeLog(await this.getLogFile(), 'success', message, options);
    }

    private async getLogFile() {
        if(!LogService.date || differenceInDays(new Date(), LogService.date) > 0){
            LogService.date = new Date();
        }
        const today = format(LogService.date, 'dd-MM-yyyy');
        const logFolder = path.join(this.config.logFolder, this.config.channel);
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
        console.error(error);
        }
    }

    
}