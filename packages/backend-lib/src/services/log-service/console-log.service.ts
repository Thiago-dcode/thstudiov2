import { LogConfig, LogLevel } from "./types";
import { LogService } from "./log.service";
import { Queue } from "bullmq";
import pc from 'picocolors'

const LEVEL_COLOURS: Record<LogLevel, (text: string) => string> = {
    info: pc.blue,
    error: pc.red,
    warn: pc.yellow,
    debug: pc.gray,
    success: pc.green,
    critical: (text) => pc.bgRed(pc.white(text)),
};

/** Writes synchronously, so it reads request/config live; `critical` dispatches like the base. */
export class ConsoleLogService extends LogService {

    constructor(config: LogConfig, queue?: Queue) {
        super(config, queue);
    }

    // Colour escape codes would corrupt JSON lines, so only colour the string format.
    private paint(color: (text: string) => string, text: string): string {
        return this.getFormat() === 'json' ? text : color(text);
    }

    protected print(level: LogLevel, line: string): void {
        super.print(level, this.paint(LEVEL_COLOURS[level], line));
    }
}