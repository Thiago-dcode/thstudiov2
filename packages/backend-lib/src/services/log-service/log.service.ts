import { format } from "date-fns";
import { LogConfig, LogLevel, LogOptions, LogServiceDriver } from "./types";

export abstract class LogService {
    protected static date:Date;
    protected static type: LogServiceDriver;
    constructor( protected readonly config: LogConfig) {
    }
    public  channel(channel: string) {
        this.config.channel = channel;
        return this;
    }
        public  name(name: string) {
            this.config.name = name;
            return this;
        }
    public async info(message: string, options?: LogOptions) {
        console.log(this.beautifyLogMessage('info', message, options));
    }

    public async error(message: string, options?: LogOptions) {
        console.error(this.beautifyLogMessage('error', message, options));
    }
    
    public async warn(message: string, options?: LogOptions) {
        console.warn(this.beautifyLogMessage('warn', message, options));
    }

    public async debug(message: string, options?: LogOptions) {
        console.debug(this.beautifyLogMessage('debug', message, options));
    }
    
    public async success(message: string, options?: LogOptions) {
        console.log(this.beautifyLogMessage('success', message, options));
    }
    protected beautifyLogMessage(level: LogLevel, message: string, options?:LogOptions) {
        let logMessage =  `[${format(LogService.date, 'dd-MM-yyyy HH:mm:ss')}] - ${level.toUpperCase()} - ${message}`;
        if(options){
            logMessage += ` - ${JSON.stringify(options)}`;
        }
        logMessage += `\n`;
        return logMessage;
    }
    
    
    
    
}