// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Fetch.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/09/15 14:12:21 by jeportie          #+#    #+#             //
//   Updated: 2025/11/12 16:41:31 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { FetchOptions, FetchRequestInit } from "../types/fetch.js";

/**
 * Generic Fetch wrapper with token & refresh support.
 *
 * - Automatically attaches Bearer tokens if provided.
 * - On 401, calls refreshFn and retries once.
 * - Logs via configurable logger.
 */

function hasWithPrefix(logger: any): logger is { withPrefix: (prefix: string) => any } {
    return typeof logger?.withPrefix === "function";
}

export default class Fetch {
    private baseURL: string;
    private getToken?: () => string | null;
    private onToken?: (t: string | null) => void;
    private refreshFn?: () => Promise<boolean>;
    private logger: any;
    private credentials: RequestCredentials;
    private beforeRequestHooks: Array<(init: RequestInit) => Promise<void> | void> = [];
    private afterResponseHooks: Array<(res: Response) => Promise<void> | void> = [];
    private isRefreshing = false;
    private refreshPromise: Promise<boolean> | null = null;

    constructor(baseURL: string, options: FetchOptions = {}) {
        this.baseURL = baseURL;
        this.getToken = options.getToken;
        this.onToken = options.onToken;
        this.refreshFn = options.refreshFn;
        const baseLogger = options.logger ?? console;

        if (hasWithPrefix(baseLogger)) {
            this.logger = baseLogger.withPrefix("[Fetch]");
        } else {
            this.logger = baseLogger;
        }

        this.credentials = options.credentials ?? "include";

        this.logger.debug?.("Initialized Fetch client with baseURL:", baseURL);
    }

    // ------------------------------------------------------------------------
    // HTTP Methods
    // ------------------------------------------------------------------------

    async get<T = any>(endpoint: string, opts?: RequestInit): Promise<T> {
        return this.send<T>("GET", endpoint, undefined, opts);
    }

    async post<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T> {
        return this.send<T>("POST", endpoint, body, opts);
    }

    async put<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T> {
        return this.send<T>("PUT", endpoint, body, opts);
    }

    async delete<T = any>(endpoint: string, body?: object, opts?: RequestInit): Promise<T> {
        return this.send<T>("DELETE", endpoint, body, opts);
    }

    // ------------------------------------------------------------------------
    // Core
    // ------------------------------------------------------------------------

    private async send<T>(
        method: string,
        endpoint: string,
        body?: object,
        opts: RequestInit = {}
    ): Promise<T> {
        const init = this.buildRequest(method, body, opts);
        const url = this.resolveUrl(endpoint);

        this.logger.info?.(`${method} ${url}`);

        for (const hook of this.beforeRequestHooks) {
            await hook(init);
        }

        const res = await fetch(url, init);

        for (const hook of this.afterResponseHooks) {
            await hook(res);
        }

        const text = await res.text();
        const data = text ? this.safeJson(text) : null;

        this.logger.debug?.(`← ${res.status} ${endpoint}`);

        if (res.ok) {
            return data;
        }

        return this.handleError<T>(res, endpoint, init, data);
    }

    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------

    async registerBeforeRequest(fn: (init: RequestInit) => Promise<void> | void) {
        this.beforeRequestHooks.push(fn);
        this.logger.debug?.("Registered beforeRequest hook.");
    }

    async registerAfterResponse(fn: (res: Response) => Promise<void> | void) {
        this.afterResponseHooks.push(fn);
        this.logger.debug?.("Registered afterResponse hook.");
    }

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    /** Builds headers, body, and attaches token */
    private buildRequest(method: string, body?: object, opts: RequestInit = {}): FetchRequestInit {
        const headers: Record<string, string> = { ...(opts.headers as any) };

        if (body && method !== "GET") {
            headers["Content-Type"] = "application/json";
        }

        const token = this.getToken?.();

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const credentials = opts.credentials ?? this.credentials ?? "same-origin";

        const init: RequestInit = {
            method,
            headers,
            credentials,
            body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        };

        this.logger.debug?.("Built request:", { method, headers, credentials });
        return init;
    }

    /** Handles HTTP errors and optional refresh retry */
    private async handleError<T>(
        res: Response,
        endpoint: string,
        init: RequestInit,
        data: any
    ): Promise<T> {
        if (
            res.status === 401 &&
            !endpoint.startsWith("/auth/refresh") &&
            !endpoint.includes("/sessions/revoke")
        ) {
            this.logger.warn?.("401 received — attempting token refresh...");

            const refreshed = await this.tryRefresh();

            if (refreshed) {
                const originalBody =
                    typeof init.body === "string" ? JSON.parse(init.body) : undefined;

                const retryInit = this.buildRequest(init.method || "GET", originalBody, init);
                const retryUrl = this.resolveUrl(endpoint);

                const retry = await fetch(retryUrl, retryInit);
                const retryText = await retry.text();
                const retryData = retryText ? this.safeJson(retryText) : null;

                this.logger.info?.(`Retry after refresh → ${retry.status} ${endpoint}`);

                if (retry.ok) {
                    return retryData as T;
                }

                const retryErr: any = new Error(
                    this.normalizeErrorMessage(
                        retryData?.message || retryData?.error || retry.statusText || "Request failed"
                    )
                );

                retryErr.status = retry.status;
                retryErr.data = retryData;
                retryErr.code = retryData?.code || "HTTP_ERROR";
                retryErr.error = retryData?.error;

                throw retryErr;
            }
        }

        const message = this.normalizeErrorMessage(
            data?.message || data?.error || res.statusText || "Request failed"
        );

        const err: any = new Error(message);
        err.status = res.status;
        err.data = data;
        err.code = data?.code || "HTTP_ERROR";
        err.error = message;

        this.logger.error?.(`❌ ${res.status} ${endpoint} — ${message}`);
        throw err;
    }

    /** Parses text safely */
    private safeJson(text: string) {
        try {
            return JSON.parse(text);
        } catch {
            this.logger.warn?.("Failed to parse JSON response:", text.slice(0, 200));
            return null;
        }
    }

    private resolveUrl(endpoint: string): string {
        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }

        return this.baseURL + endpoint;
    }

    /** Normalizes Fastify/AJV validation messages */
    private normalizeErrorMessage(msg: string) {
        if (!msg.startsWith("body/")) {
            return msg;
        }

        msg = msg.replace(/^body\//, "");

        const match = msg.match(/^([a-zA-Z0-9_]+)/);

        if (match) {
            const field = match[1];
            const capitalized = field.charAt(0).toUpperCase() + field.slice(1);
            msg = msg.replace(field, capitalized);
        }

        msg = msg
            .replace(/\bUser\b/, "User/Email")
            .replace(/\bPwd\b/, "Password");

        return msg;
    }

    /** Tries to refresh the token once and handle logout */
    private async tryRefresh(): Promise<boolean> {
        if (this.isRefreshing && this.refreshPromise) {
            this.logger.info?.("Waiting for ongoing refresh...");
            return this.refreshPromise;
        }

        this.isRefreshing = true;

        this.refreshPromise = (async () => {
            try {
                const result = await this.refreshFn?.();
                const token = typeof result === "string" ? result : null;
                const ok = !!result;

                if (token) {
                    this.onToken?.(token);
                    this.logger.info?.("Token refreshed and applied.");
                }

                if (!ok) {
                    this.logger.warn?.("Refresh function returned false/null. Logging out...");
                    this.onToken?.(null);

                    window.dispatchEvent(
                        new CustomEvent("auth:logout", {
                            detail: { reason: "refresh_failed" },
                        })
                    );
                }

                return ok;
            } catch (err) {
                this.logger.error?.("Token refresh failed with exception:", err);

                this.onToken?.(null);

                window.dispatchEvent(
                    new CustomEvent("auth:logout", {
                        detail: { reason: "refresh_exception" },
                    })
                );

                return false;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }
}

