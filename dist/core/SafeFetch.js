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
/**
 * Generic helper to handle a fetch call safely.
 * Wraps calls to always return { data, error }.
 */
async function handleRequest(action, logger) {
    try {
        const data = await action();
        logger.debug?.("Safe request succeeded.");
        return { data, error: null };
    }
    catch (err) {
        const msg = `${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;
        logger.error?.(`❌ Safe request failed — ${msg}`);
        return { data: null, error: err };
    }
}
/** Safe wrapper for GET requests */
export async function safeGet(API, url, opts, logger = console) {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafeGet]") : logger;
    return handleRequest(() => API.get(url, opts), scoped);
}
/** Safe wrapper for POST requests */
export async function safePost(API, url, body, opts, logger = console) {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafePost]") : logger;
    return handleRequest(() => API.post(url, body, opts), scoped);
}
/** Safe wrapper for PUT requests */
export async function safePut(API, url, body, opts, logger = console) {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafePut]") : logger;
    return handleRequest(() => API.put(url, body, opts), scoped);
}
/** Safe wrapper for DELETE requests */
export async function safeDelete(API, url, body, opts, logger = console) {
    const scoped = logger.withPrefix ? logger.withPrefix("[SafeDelete]") : logger;
    return handleRequest(() => API.delete(url, body, opts), scoped);
}
