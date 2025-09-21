import { format } from "date-fns";
import { LogginConfig, LogginLevel, LogginOptions, LogginServiceType } from "./types";

export abstract class LogginService {
    protected static date:Date;
    protected static type: LogginServiceType;
    constructor( protected readonly config: LogginConfig) {
    }
    public  channel(channel: string) {
        this.config.channel = channel;
        return this;
    }
        public  name(name: string) {
            this.config.name = name;
            return this;
        }
    public async info(message: string, options?: LogginOptions) {
        console.log(this.beautifyLoggin('info', message, options));
    }

    public async error(message: string, options?: LogginOptions) {
        console.error(this.beautifyLoggin('error', message, options));
    }
    
    public async warn(message: string, options?: LogginOptions) {
        console.warn(this.beautifyLoggin('warn', message, options));
    }

    public async debug(message: string, options?: LogginOptions) {
        console.debug(this.beautifyLoggin('debug', message, options));
    }
    
    public async success(message: string, options?: LogginOptions) {
        console.log(this.beautifyLoggin('success', message, options));
    }
    protected beautifyLoggin(level: LogginLevel, message: string, options?:LogginOptions) {
        let logMessage =  `[${format(LogginService.date, 'dd-MM-yyyy HH:mm:ss')}] - ${level.toUpperCase()} - ${message}`;
        if(options){
            logMessage += ` - ${JSON.stringify(options)}`;
        }
        logMessage += `\n`;
        return logMessage;
    }
    
    
    
    
}