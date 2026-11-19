import pc from 'picocolors';
import { LogEntry, LogLevel } from "../types";
import { LogDriver } from "./log.driver";

const LEVEL_COLOURS: Record<LogLevel, (text: string) => string> = {
    info: pc.blue,
    error: pc.red,
    warn: pc.yellow,
    debug: pc.gray,
    success: pc.green,
    critical: (text) => pc.bgRed(pc.white(text)),
};

/** Prints each entry to stdout/stderr. */
export class ConsoleLogDriver extends LogDriver {
    async process(entry: LogEntry): Promise<void> {
        const level = entry.level.toLowerCase() as LogLevel;
        const line = this.formatLogEntry(entry);
        // Colour escape codes would corrupt JSON lines, so only colour the string format.
        print(level, entry.format === 'json' ? line : LEVEL_COLOURS[level](line));
    }
}

function print(level: LogLevel, line: string): void {
    switch (level) {
        case 'error':
        case 'critical':
            console.error(line);
            return;
        case 'warn':
            console.warn(line);
            return;
        case 'debug':
            console.debug(line);
            return;
        default:
            console.log(line);
    }
}
