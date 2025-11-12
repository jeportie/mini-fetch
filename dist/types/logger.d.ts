export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
/**
 * Generic interface for any prefixed or standard logger.
 * Compatible with your frontend logger and native console.
 */
export interface Logger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    setLevel?: (level: LogLevel) => void;
    withPrefix?: (prefix: string) => Logger;
}
