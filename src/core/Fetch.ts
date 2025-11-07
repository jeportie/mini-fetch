// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Fetch.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/09/15 14:12:21 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:51:27 by jeportie         ###   ########.fr       //
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
export default class Fetch {
    private baseURL: string;
    private getToken?: () => string | null;
    private onToken?: (t: string | null) => void;
    private refreshFn?: () => Promise<boolean>;
    private logger: Console;
    private credentials: RequestCredentials;
    private beforeRequestHooks: Array<(init: RequestInit) => Promise<void> | void> = [];
    private afterResponseHooks: Array<(res: Response) => Promise<void> | void> = [];

    constructor(baseURL: string, options: FetchOptions = {}) {
        this.baseURL = baseURL;
        this.getToken = options.getToken;
        this.onToken = options.onToken;
        this.refreshFn = options.refreshFn;
        this.logger = options.logger ?? console;
        this.credentials = options.credentials ?? "include";
    }

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

        this.logger.info?.(`[Fetch] → ${method} ${url}`);


        for (const hook of this.beforeRequestHooks) await hook(init);
        const res = await fetch(url, init);
        for (const hook of this.afterResponseHooks) await hook(res);

        const text = await res.text();
        const data = text ? this.safeJson(text) : null;

        this.logger.info?.(`[Fetch] ← ${res.status} ${endpoint}`);

        if (res.ok) return data;

        return this.handleError<T>(res, endpoint, init, data);
    }

    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    async registerBeforeRequest(fn: (init: RequestInit) => Promise<void> | void) {
        this.beforeRequestHooks.push(fn);
    }

    async registerAfterResponse(fn: (res: Response) => Promise<void> | void) {
        this.afterResponseHooks.push(fn);
    }

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    /** Builds headers, body, and attaches token */
    private buildRequest(method: string, body?: object, opts: RequestInit = {}): FetchRequestInit {
        const headers: Record<string, string> = { ...(opts.headers as any) };
        if (body && method !== "GET") headers["Content-Type"] = "application/json";

        const token = this.getToken?.();
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // allow per-call override; otherwise use instance default
        const credentials = opts.credentials ?? this.credentials ?? "same-origin";

        const init: RequestInit = {
            method,
            headers,
            credentials,
            body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        };
        return init;
    }

    /** Handles HTTP errors and optional refresh retry */
    private async handleError<T>(
        res: Response,
        endpoint: string,
        init: RequestInit,
        data: any
    ): Promise<T> {
        // Handle 401 with refresh
        if (res.status === 401 && !endpoint.startsWith("/auth/")) {
            this.logger.warn?.("[Fetch] 401 received, attempting refresh...");
            if (await this.tryRefresh()) {
                const retryUrl = this.resolveUrl(endpoint);
                const retry = await fetch(retryUrl, init);
                const retryText = await retry.text();
                const retryData = retryText ? this.safeJson(retryText) : null;

                if (retry.ok) return retryData as T;

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

        // Normal error path
        const message = this.normalizeErrorMessage(
            data?.message || data?.error || res.statusText || "Request failed"
        );
        const err: any = new Error(message);
        err.status = res.status;
        err.data = data;
        err.code = data?.code || "HTTP_ERROR";
        err.error = message;
        throw err;
    }

    /** Parses text safely */
    private safeJson(text: string) {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    private resolveUrl(endpoint: string): string {
        if (/^https?:\/\//i.test(endpoint))
            return endpoint; // absolute URL, no base
        return this.baseURL + endpoint;
    }

    /** Normalizes Fastify/AJV validation messages */
    private normalizeErrorMessage(msg: string) {
        if (!msg.startsWith("body/")) return msg;

        // Remove the "body/" prefix
        msg = msg.replace(/^body\//, "");

        // Extract the field name (first word before a space or another word)
        const match = msg.match(/^([a-zA-Z0-9_]+)/);
        if (match) {
            const field = match[1];
            const capitalized = field.charAt(0).toUpperCase() + field.slice(1);

            // Replace only the first occurrence of that field
            msg = msg.replace(field, capitalized);
        }

        // Optional specific human mappings
        msg = msg
            .replace(/\bUser\b/, "User/Email") // keep your special case
            .replace(/\bPwd\b/, "Password");

        return msg;
    }


    /** Tries to refresh the token once and handle logout */
    private async tryRefresh(): Promise<boolean> {
        try {
            const ok = await this.refreshFn?.();
            if (ok) {
                this.logger.info?.("[Fetch] Token refreshed");
                return true;
            }
            this.logger.warn?.("[Fetch] RefreshFn returned false");
            this.onToken?.(null);
            window.dispatchEvent(
                new CustomEvent("auth:logout", { detail: { reason: "refresh_failed" } })
            );
            return false;
        } catch (err) {
            // this.logger.error?.("[Fetch] Refresh exception:", err);
            this.onToken?.(null);
            window.dispatchEvent(
                new CustomEvent("auth:logout", { detail: { reason: "refresh_exception" } })
            );
            return false;
        }
    }
}
