import { LogConfig, LogOptions } from "./types";
import { LogService } from "./log.service";
import { Queue } from "bullmq";
import pc from 'picocolors'
export class ConsoleLogService extends LogService {

    constructor(config: LogConfig, queue?: Queue) {
        super(config, queue);
    }
    public info(message: string, options?: LogOptions): this {
        console.log(pc.blue(this.beautifyLogMessage('info', message, options)));
        return this;
    }

    public error(message: string, options?: LogOptions): this {
        console.error(pc.red(this.beautifyLogMessage('error', message, options)));
        return this;
    }
    
    public warn(message: string, options?: LogOptions): this {
        console.warn(pc.yellow(this.beautifyLogMessage('warn', message, options)));
        return this;
    }

    public debug(message: string, options?: LogOptions): this {
        console.debug(pc.gray(this.beautifyLogMessage('debug', message, options)));
        return this;
    }
    
    public success(message: string, options?: LogOptions): this {
        console.log(pc.green(this.beautifyLogMessage('success', message, options)));
        return this;
    }



  
    
}