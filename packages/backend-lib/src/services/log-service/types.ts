export type LogConfig = {
    logFolder?: string;
    channel: string;
    name?: string;
    callback? :{
        channel: string;
        callback: (level: LogLevel, message: string, options?: LogOptions) => Promise<void>;
    }
}
export type LogServiceDriver = 'console' | 'file';
export type LogOptions = { [key: string]: any };
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'success';