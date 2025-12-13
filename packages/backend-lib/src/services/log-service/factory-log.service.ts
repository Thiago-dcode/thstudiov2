import { LogConfig, LogServiceDriver } from "./types";
import { LogService } from "./log.service";
import { ConsoleLogService } from "./console-log.service";
import { FileLogService } from "./file-log.service";

export class FactoryLogService {
    public static createLogService(type: LogServiceDriver, config: LogConfig): LogService {
        switch(type){
            case 'console':
                return new ConsoleLogService(config);
            case 'file':
                return new FileLogService(config);
            default:
                return new ConsoleLogService(config);
        }
    }
}