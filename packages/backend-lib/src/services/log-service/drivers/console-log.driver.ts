import pc from 'picocolors';
import { LogContext, LogLevel, LogObjectEntry } from "../types";
import { LogDriver } from "./log.driver";

const LEVEL_COLOURS: Record<LogLevel, (text: string) => string> = {
    info: pc.blue,
    error: pc.red,
    warn: pc.yellow,
    debug: pc.gray,
    success: pc.green,
    critical: (text) => pc.bgRed(pc.white(text)),
};

/** Prints each entry to stdout/stderr, one line each. The level is read from the line's context. */
export class ConsoleLogDriver<E extends LogObjectEntry> extends LogDriver<E> {
    async process(logContext: LogContext, entry: E): Promise<void> {
        const { level, format } = logContext;
        const line = this.formatLogEntry(format, entry).trimEnd();
        // Colour escape codes would corrupt JSON lines, so only colour the logfmt format.
        print(level, format === 'json' ? line : LEVEL_COLOURS[level](line));
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
