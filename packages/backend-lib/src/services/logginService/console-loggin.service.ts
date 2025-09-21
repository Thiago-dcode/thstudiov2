import { LogginConfig, LogginOptions } from "./types";
import { LogginService } from "./loggin.service";
import pc from 'picocolors'
export class ConsoleLogginService extends LogginService {

    constructor(config: LogginConfig) {
        super(config);
    }
    public  async info(message: string, options?: LogginOptions) {
        console.log(pc.blue(this.beautifyLoggin('info', message, options)));
    }

    public  async error(message: string, options?: LogginOptions) {
        console.error(pc.red(this.beautifyLoggin('error', message, options)));
    }
    
    public  async warn(message: string, options?: LogginOptions) {
        console.warn(pc.yellow(this.beautifyLoggin('warn', message, options)));
    }

    public  async debug(message: string, options?: LogginOptions) {
        console.debug(pc.gray(this.beautifyLoggin('debug', message, options)));
    }
    
    public  async success(message: string, options?: LogginOptions) {
        console.log(pc.green(this.beautifyLoggin('success', message, options)));
    }



  
    
}