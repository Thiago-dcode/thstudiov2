import { LogginConfig, LogginServiceType } from "./types";
import { LogginService } from "./loggin.service";
import { ConsoleLogginService } from "./console-loggin.service";
import { FileLogginService } from "./file-loggin.service";

export class FactoryLogginService {
    public static createLogginService(type: LogginServiceType, config: LogginConfig): LogginService {
        switch(type){
            case 'console':
                return new ConsoleLogginService(config);
            case 'file':
                return new FileLogginService(config);
            default:
                return new ConsoleLogginService(config);
        }
    }
}