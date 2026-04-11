import { Queue } from "bullmq";
import { LogConfig, LogServiceDriver } from "./types";
import { LogService } from "./log.service";
import { ConsoleLogService } from "./console-log.service";
import { FileLogService } from "./file-log.service";

export class FactoryLogService {
    public static createLogService(type: LogServiceDriver, config: LogConfig, queue?: Queue): LogService {
        switch(type){
            case 'console':
                return new ConsoleLogService(config, queue);
            case 'file':
                return new FileLogService(config, queue);
            default:
                return new ConsoleLogService(config, queue);
        }
    }
}