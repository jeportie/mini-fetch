import { FetchOptions } from "../types/fetch.js";
/**
 * Generic Fetch wrapper with token & refresh support.
 *
 * - Automatically attaches Bearer tokens if provided.
 * - On 401, calls refreshFn and retries once.
 * - Logs via configurable logger.
 */
export default class Fetch {
    private baseURL;
    private getToken?;
    private onToken?;
    private refreshFn?;
    private logger;
    private credentials;
    private beforeRequestHooks;
    private afterResponseHooks;
    constructor(baseURL: string, options?: FetchOptions);
    get<T = any>(endpoint: string, opts?: RequestInit): Promise<T>;
    post<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T>;
    put<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T>;
    delete<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T>;
    private send;
    registerBeforeRequest(fn: (init: RequestInit) => Promise<void> | void): Promise<void>;
    registerAfterResponse(fn: (res: Response) => Promise<void> | void): Promise<void>;
    /** Builds headers, body, and attaches token */
    private buildRequest;
    /** Handles HTTP errors and optional refresh retry */
    private handleError;
    /** Parses text safely */
    private safeJson;
    private resolveUrl;
    /** Normalizes Fastify/AJV validation messages */
    private normalizeErrorMessage;
    /** Tries to refresh the token once and handle logout */
    private tryRefresh;
}
