import { LogConfig, LogOptions } from "./types";
import { LogService } from "./log.service";
import pc from 'picocolors'
export class ConsoleLogService extends LogService {

    constructor(config: LogConfig) {
        super(config);
    }
    public  async info(message: string, options?: LogOptions) {
        console.log(pc.blue(this.beautifyLogMessage('info', message, options)));
    }

    public  async error(message: string, options?: LogOptions) {
        console.error(pc.red(this.beautifyLogMessage('error', message, options)));
    }
    
    public  async warn(message: string, options?: LogOptions) {
        console.warn(pc.yellow(this.beautifyLogMessage('warn', message, options)));
    }

    public  async debug(message: string, options?: LogOptions) {
        console.debug(pc.gray(this.beautifyLogMessage('debug', message, options)));
    }
    
    public  async success(message: string, options?: LogOptions) {
        console.log(pc.green(this.beautifyLogMessage('success', message, options)));
    }



  
    
}