import path from "path";
import { LogginConfig, LogginLevel, LogginOptions } from "./types";
import { LogginService } from "./loggin.service";
import fs from 'node:fs/promises'
import {checkFileExistsAsync} from '@repo/backend-lib/utils';
import { differenceInDays ,format} from "date-fns";
export class FileLogginService extends LogginService {

    constructor(config: LogginConfig) {
        super(config);
    }
    public  async info(message: string, options?:LogginOptions) {
       await this.writeLoggin(await this.getLogginFile(), 'info', message, options);
    }
    public  async error(message: string, options?:LogginOptions) {
        await this.writeLoggin(await this.getLogginFile(), 'error', message, options);
    }
    public  async warn(message: string, options?:LogginOptions) {
        await this.writeLoggin(await this.getLogginFile(), 'warn', message, options);
    }
    public  async debug(message: string, options?:LogginOptions) {
        await this.writeLoggin(await this.getLogginFile(), 'debug', message, options);
    }
    public  async success(message: string, options?:LogginOptions) {
        await this.writeLoggin(await this.getLogginFile(), 'success', message, options);
    }

    private async getLogginFile() {
        if(!LogginService.date || differenceInDays(new Date(), LogginService.date) > 0){
            LogginService.date = new Date();
        }
        const today = format(LogginService.date, 'dd-MM-yyyy');
        const logginFolder = path.join(this.config.logginFolder, this.config.channel);
        if(! (await checkFileExistsAsync(logginFolder))){
           await fs.mkdir(logginFolder, { recursive: true });
        }
       return path.join(logginFolder, `${today}${this.config.name ? `.${this.config.name}` : ''}.log`);
    }

    private async writeLoggin(logginFile: string, level: LogginLevel, message: string, options?:LogginOptions) {
       if(!(await checkFileExistsAsync(logginFile))){
       await fs.writeFile(logginFile, '');
       }
       await fs.appendFile(logginFile, this.beautifyLoggin(level, message, options));
    }

    
}