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
/**
 * Generic Fetch wrapper with token & refresh support.
 *
 * - Automatically attaches Bearer tokens if provided.
 * - On 401, calls refreshFn and retries once.
 * - Logs via configurable logger.
 */
export default class Fetch {
    baseURL;
    getToken;
    onToken;
    refreshFn;
    logger;
    constructor(baseURL, options = {}) {
        this.baseURL = baseURL;
        this.getToken = options.getToken;
        this.onToken = options.onToken;
        this.refreshFn = options.refreshFn;
        this.logger = options.logger ?? console;
    }
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
        const url = this.baseURL + endpoint;
        this.logger.info?.(`[Fetch] → ${method} ${url}`);
        const res = await fetch(url, init);
        const text = await res.text();
        const data = text ? this.safeJson(text) : null;
        this.logger.info?.(`[Fetch] ← ${res.status} ${endpoint}`);
        if (res.ok)
            return data;
        return this.handleError(res, endpoint, init, data);
    }
    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------
    /** Builds headers, body, and attaches token */
    buildRequest(method, body, opts = {}) {
        const headers = { ...opts.headers };
        if (body && method !== "GET")
            headers["Content-Type"] = "application/json";
        const token = this.getToken?.();
        if (token)
            headers["Authorization"] = `Bearer ${token}`;
        const init = {
            method,
            headers,
            credentials: "include",
            body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        };
        return init;
    }
    /** Handles HTTP errors and optional refresh retry */
    async handleError(res, endpoint, init, data) {
        // Handle 401 with refresh
        if (res.status === 401 && !endpoint.startsWith("/auth/")) {
            this.logger.warn?.("[Fetch] 401 received, attempting refresh...");
            if (await this.tryRefresh()) {
                const retry = await fetch(this.baseURL + endpoint, init);
                const retryText = await retry.text();
                const retryData = retryText ? this.safeJson(retryText) : null;
                if (retry.ok)
                    return retryData;
                const retryErr = new Error(this.normalizeErrorMessage(retryData?.message || retryData?.error || retry.statusText || "Request failed"));
                retryErr.status = retry.status;
                retryErr.data = retryData;
                retryErr.code = retryData?.code || "HTTP_ERROR";
                retryErr.error = retryData?.error;
                throw retryErr;
            }
        }
        // Normal error path
        const message = this.normalizeErrorMessage(data?.message || data?.error || res.statusText || "Request failed");
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        err.code = data?.code || "HTTP_ERROR";
        err.error = message;
        throw err;
    }
    /** Parses text safely */
    safeJson(text) {
        try {
            return JSON.parse(text);
        }
        catch {
            return null;
        }
    }
    /** Normalizes Fastify/AJV validation messages */
    normalizeErrorMessage(msg) {
        return msg.startsWith("body/")
            ? msg
                .replace(/^body\//, "")
                .replace(/\buser\b/, "User/Email")
                .replace(/\bpwd\b/, "Password")
            : msg;
    }
    /** Tries to refresh the token once and handle logout */
    async tryRefresh() {
        try {
            const ok = await this.refreshFn?.();
            if (ok) {
                this.logger.info?.("[Fetch] Token refreshed");
                return true;
            }
            this.logger.warn?.("[Fetch] RefreshFn returned false");
            this.onToken?.(null);
            window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "refresh_failed" } }));
            return false;
        }
        catch (err) {
            // this.logger.error?.("[Fetch] Refresh exception:", err);
            this.onToken?.(null);
            window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "refresh_exception" } }));
            return false;
        }
    }
}
