import { format } from "date-fns";
import { LogConfig, LogLevel, LogOptions, LogServiceDriver } from "./types";

export abstract class LogService {
    protected static date:Date;
    protected static type: LogServiceDriver;
    private static pendingLogs: Promise<void>[] = [];

    constructor( protected readonly config: LogConfig) {
    }

    /**
     * Tracks a log operation without blocking execution.
     * Use flush() to wait for all pending logs before process exit.
     */
    protected static trackLog(promise: Promise<void>): void {
        const tracked = promise.finally(() => {
            const index = LogService.pendingLogs.indexOf(tracked);
            if (index > -1) {
                LogService.pendingLogs.splice(index, 1);
            }
        });
        LogService.pendingLogs.push(tracked);
    }

    /**
     * Waits for all pending log operations to complete.
     * Call this before process exit to ensure all logs are written.
     */
    public static async flush(): Promise<void> {
        await Promise.all(LogService.pendingLogs);
    }
    public  channel(channel: string) {
        this.config.channel = channel;
        return this;
    }
        public  name(name: string) {
            this.config.name = name;
            return this;
        }
    public info(message: string, options?: LogOptions): this {
        console.log(this.beautifyLogMessage('info', message, options));
        return this;
    }

    public error(message: string, options?: LogOptions): this {
        console.error(this.beautifyLogMessage('error', message, options));
        return this;
    }
    
    public warn(message: string, options?: LogOptions): this {
        console.warn(this.beautifyLogMessage('warn', message, options));
        return this;
    }

    public debug(message: string, options?: LogOptions): this {
        console.debug(this.beautifyLogMessage('debug', message, options));
        return this;
    }
    
    public success(message: string, options?: LogOptions): this {
        console.log(this.beautifyLogMessage('success', message, options));
        return this;
    }
    protected beautifyLogMessage(level: LogLevel, message: string, options?:LogOptions) {
        let logMessage =  `[${format(LogService.date, 'yyyy-mm-dd HH:mm:ss')}] - ${level.toUpperCase()} - ${message}`;
        if(options){
            logMessage += ` - ${JSON.stringify(options)}`;
        }
        logMessage += `\n`;
        return logMessage;
    }
    protected async callCallback(level: LogLevel, message: string, options?:LogOptions) {
        if(this.config.callback && this.config.callback.channel === this.config.channel){
            await this.config.callback.callback(level, message, options);
        } 
    }
    
    
    
    
}