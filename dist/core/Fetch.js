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
/**
 * Generic Fetch wrapper with token & refresh support.
 *
 * - Automatically attaches Bearer tokens if provided.
 * - On 401, calls refreshFn and retries once.
 * - Logs via configurable logger.
 */
function hasWithPrefix(logger) {
    return typeof logger?.withPrefix === "function";
}
export default class Fetch {
    baseURL;
    getToken;
    onToken;
    refreshFn;
    logger;
    credentials;
    beforeRequestHooks = [];
    afterResponseHooks = [];
    isRefreshing = false;
    refreshPromise = null;
    constructor(baseURL, options = {}) {
        this.baseURL = baseURL;
        this.getToken = options.getToken;
        this.onToken = options.onToken;
        this.refreshFn = options.refreshFn;
        const baseLogger = options.logger ?? console;
        if (hasWithPrefix(baseLogger)) {
            this.logger = baseLogger.withPrefix("[Fetch]");
        }
        else {
            this.logger = baseLogger;
        }
        this.credentials = options.credentials ?? "include";
        this.logger.debug?.("Initialized Fetch client with baseURL:", baseURL);
    }
    // ------------------------------------------------------------------------
    // HTTP Methods
    // ------------------------------------------------------------------------
    async get(endpoint, opts) {
        return this.send("GET", endpoint, undefined, opts);
    }
    async post(endpoint, body, opts) {
        return this.send("POST", endpoint, body, opts);
    }
    async put(endpoint, body, opts) {
        return this.send("PUT", endpoint, body, opts);
    }
    async delete(endpoint, body, opts) {
        return this.send("DELETE", endpoint, body, opts);
    }
    // ------------------------------------------------------------------------
    // Core
    // ------------------------------------------------------------------------
    async send(method, endpoint, body, opts = {}) {
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
        return this.handleError(res, endpoint, init, data);
    }
    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    async registerBeforeRequest(fn) {
        this.beforeRequestHooks.push(fn);
        this.logger.debug?.("Registered beforeRequest hook.");
    }
    async registerAfterResponse(fn) {
        this.afterResponseHooks.push(fn);
        this.logger.debug?.("Registered afterResponse hook.");
    }
    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------
    /** Builds headers, body, and attaches token */
    buildRequest(method, body, opts = {}) {
        const headers = { ...opts.headers };
        if (body && method !== "GET") {
            headers["Content-Type"] = "application/json";
        }
        const token = this.getToken?.();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const credentials = opts.credentials ?? this.credentials ?? "same-origin";
        const init = {
            method,
            headers,
            credentials,
            body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        };
        this.logger.debug?.("Built request:", { method, headers, credentials });
        return init;
    }
    /** Handles HTTP errors and optional refresh retry */
    async handleError(res, endpoint, init, data) {
        if (res.status === 401 &&
            !endpoint.startsWith("/auth/refresh") &&
            !endpoint.includes("/sessions/revoke")) {
            this.logger.warn?.("401 received — attempting token refresh...");
            const refreshed = await this.tryRefresh();
            if (refreshed) {
                const originalBody = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
                const retryInit = this.buildRequest(init.method || "GET", originalBody, init);
                const retryUrl = this.resolveUrl(endpoint);
                const retry = await fetch(retryUrl, retryInit);
                const retryText = await retry.text();
                const retryData = retryText ? this.safeJson(retryText) : null;
                this.logger.info?.(`Retry after refresh → ${retry.status} ${endpoint}`);
                if (retry.ok) {
                    return retryData;
                }
                const retryErr = new Error(this.normalizeErrorMessage(retryData?.message || retryData?.error || retry.statusText || "Request failed"));
                retryErr.status = retry.status;
                retryErr.data = retryData;
                retryErr.code = retryData?.code || "HTTP_ERROR";
                retryErr.error = retryData?.error;
                throw retryErr;
            }
        }
        const message = this.normalizeErrorMessage(data?.message || data?.error || res.statusText || "Request failed");
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        err.code = data?.code || "HTTP_ERROR";
        err.error = message;
        this.logger.error?.(`❌ ${res.status} ${endpoint} — ${message}`);
        throw err;
    }
    /** Parses text safely */
    safeJson(text) {
        try {
            return JSON.parse(text);
        }
        catch {
            this.logger.warn?.("Failed to parse JSON response:", text.slice(0, 200));
            return null;
        }
    }
    resolveUrl(endpoint) {
        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }
        return this.baseURL + endpoint;
    }
    /** Normalizes Fastify/AJV validation messages */
    normalizeErrorMessage(msg) {
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
    async tryRefresh() {
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
                    window.dispatchEvent(new CustomEvent("auth:logout", {
                        detail: { reason: "refresh_failed" },
                    }));
                }
                return ok;
            }
            catch (err) {
                this.logger.error?.("Token refresh failed with exception:", err);
                this.onToken?.(null);
                window.dispatchEvent(new CustomEvent("auth:logout", {
                    detail: { reason: "refresh_exception" },
                }));
                return false;
            }
            finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();
        return this.refreshPromise;
    }
}
