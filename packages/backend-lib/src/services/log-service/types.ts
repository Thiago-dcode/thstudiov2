export type LogConfig = {
    logFolder: string;
    channel: string;
    name?: string;
}
export type LogServiceDriver = 'console' | 'file';
export type LogOptions = { [key: string]: any };
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'success';