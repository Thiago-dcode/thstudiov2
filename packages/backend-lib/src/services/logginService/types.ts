
export type LogginConfig = {
    logginFolder: string;
    channel: string;
    name?: string;
}
export type LogginServiceType = 'console' | 'file';
export type LogginOptions = { [key: string]: any };
export type LogginLevel = 'info' | 'error' | 'warn' | 'debug' | 'success';