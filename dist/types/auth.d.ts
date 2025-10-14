export interface AuthOptions {
    storageKey?: string;
    refreshFn?: () => Promise<string | null>;
    logger?: Console;
}
