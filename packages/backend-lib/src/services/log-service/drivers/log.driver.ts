import { format } from "date-fns";
import { LogEntry } from "../types";

/** Writes one entry somewhere (a file, the console). A buffer hands entries to it on flush. */
export abstract class LogDriver {
    abstract process(entry: LogEntry): Promise<void>;

    protected formatLogEntry(entry: LogEntry): string {
        // `format` only picks the layout; it is not part of the written line.
        const { format: lineFormat, ...line } = entry;
        if (lineFormat === 'string') {
            const timestamp = format(new Date(line.timestamp), 'yyyy-MM-dd HH:mm:ss');
            const operation = line.operation ? `[${line.operation}]` : '';
            const id = line.id ? `[${line.id}]` : '';
            const method = line.request?.method ? `[${line.request.method}]` : '';
            let text = `[${timestamp}][${line.channel}]${operation} - ${line.level} -${id}${method} ${line.message}`;
            if (line.extraInfo !== undefined) text += ` - ${JSON.stringify(line.extraInfo)}`;
            return text + '\n';
        }
        return JSON.stringify(line) + '\n';
    }
}
