// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   SafeFetch.ts                                       :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 14:35:31 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:38:21 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { SafeResult } from "../types/result.js";
import Fetch from "./Fetch.js";

/**
 * Generic helper to handle a fetch call safely.
 * @internal
 */
async function handleRequest<T>(
    action: () => Promise<T>,
    logger: Console
): Promise<SafeResult<T>> {
    try {
        const data = await action();
        return { data, error: null };
    } catch (err: any) {
        const msg = `[API] ❌ ${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;
        logger.error?.(msg);
        return { data: null, error: err };
    }
}

/** Safe wrapper for GET requests */
export async function safeGet<T = any>(
    API: Fetch,
    url: string,
    opts?: RequestInit,
    logger: Console = console
): Promise<SafeResult<T>> {
    return handleRequest(() => API.get<T>(url, opts), logger);
}

/** Safe wrapper for POST requests */
export async function safePost<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: Console = console
): Promise<SafeResult<T>> {
    return handleRequest(() => API.post<T>(url, body, opts), logger);
}

/** Safe wrapper for PUT requests */
export async function safePut<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: Console = console
): Promise<SafeResult<T>> {
    return handleRequest(() => API.put<T>(url, body, opts), logger);
}

/** Safe wrapper for DELETE requests */
export async function safeDelete<T = any>(
    API: Fetch,
    url: string,
    body?: object,
    opts?: RequestInit,
    logger: Console = console
): Promise<SafeResult<T>> {
    return handleRequest(() => API.delete<T>(url, body, opts), logger);
}

