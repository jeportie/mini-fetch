export interface FetchOptions {
    getToken?: () => string | null;
    onToken?: (token: string | null) => void;
    refreshFn?: () => Promise<boolean>;
    logger?: Console;
    credentials?: RequestCredentials;
}
export interface FetchRequestInit extends RequestInit {
    headers?: HeadersInit;
}
export interface FetchResult<T = any> {
    data: T | null;
    error: Error | null;
}
