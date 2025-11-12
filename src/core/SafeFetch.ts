// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   SafeFetch.ts                                       :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 14:35:31 by jeportie          #+#    #+#             //
//   Updated: 2025/11/12 16:36:17 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { SafeResult } from "../types/result.js";
import Fetch from "./Fetch.js";

/**
 * Generic helper to handle a fetch call safely.
 * Wraps calls to always return { data, error }.
 */
async function handleRequest<T>(
    action: () => Promise<T>,
    logger: any
): Promise<SafeResult<T>> {
    try {
        const data = await action();

        logger.debug?.("Safe request succeeded.");
        return { data, error: null };
    } catch (err: any) {
        const msg = `${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;

        logger.error?.(`❌ Safe request failed — ${msg}`);
        return { data: null, error: err };
    }
}

/** Safe wrapper for GET requests */
export async function safeGet<T = any>(
    API: Fetch,
    url: string,
    opts?: RequestInit,
    logger: any = console
): Promise<SafeResult<T>> {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafeGet]") : logger;
    return handleRequest(() => API.get<T>(url, opts), scoped);
}

/** Safe wrapper for POST requests */
export async function safePost<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: any = console
): Promise<SafeResult<T>> {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafePost]") : logger;
    return handleRequest(() => API.post<T>(url, body, opts), scoped);
}

/** Safe wrapper for PUT requests */
export async function safePut<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: any = console
): Promise<SafeResult<T>> {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafePut]") : logger;
    return handleRequest(() => API.put<T>(url, body, opts), scoped);
}

/** Safe wrapper for DELETE requests */
export async function safeDelete<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: any = console
): Promise<SafeResult<T>> {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafeDelete]") : logger;
    return handleRequest(() => API.delete<T>(url, body, opts), scoped);
}

