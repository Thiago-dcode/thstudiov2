import { LogContext, LogFormat, LogObjectEntry } from "../types";

/** Writes one entry somewhere (a file, the console). A buffer hands entries to it on flush. */
export abstract class LogDriver<E extends LogObjectEntry> {
    abstract process(logContext: LogContext, entry: E): Promise<void>;




    protected formatLogEntry(format: LogFormat, entry: E): string {
        // `format` only picks the layout; it is not part of the written line.
        const { format: _entryFormat, ...line } = entry;

        if (format === 'logfmt') return toLogfmt(line) + '\n';
        return JSON.stringify(line) + '\n';
    }
}

/**
 * `key=value` pairs in entry key order. Nested plain objects (`request`, `extraInfo`) flatten to
 * dotted keys (`request.method=GET`); arrays and other non-plain values are written as JSON.
 * `null`/`undefined` values are skipped.
 */
function toLogfmt(record: Record<string, any>): string {
    const pairs: string[] = [];
    const visit = (value: unknown, key: string, seen: Set<object>): void => {
        if (value === null || value === undefined) return;
        if (isPlainObject(value)) {
            if (seen.has(value)) return void pairs.push(`${key}="[Circular]"`);
            seen.add(value);
            for (const [child, childValue] of Object.entries(value)) {
                visit(childValue, `${key}.${sanitizeKey(child)}`, seen);
            }
            seen.delete(value);
            return;
        }
        pairs.push(`${key}=${formatValue(value)}`);
    };
    for (const [key, value] of Object.entries(record)) {
        // A non-object extraInfo (a string, a number) keeps its own key.
        visit(value, sanitizeKey(key), new Set());
    }
    return pairs.join(' ');
}

function isPlainObject(value: unknown): value is LogObjectEntry {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/** Keys cannot hold spaces, `=` or quotes in logfmt. */
function sanitizeKey(key: string): string {
    return key.replace(/[\s="]/g, '_') || '_';
}

function formatValue(value: unknown): string {
    let text: string;
    if (typeof value === 'string') text = value;
    else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') text = String(value);
    else if (value instanceof Date) text = value.toISOString();
    else if (value instanceof Error) text = value.message;
    else {
        try {
            text = JSON.stringify(value) ?? String(value);
        } catch {
            text = String(value);
        }
    }
    if (text !== '' && !/[\s="\\]/.test(text)) return text;
    const escaped = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    return `"${escaped}"`;
}
