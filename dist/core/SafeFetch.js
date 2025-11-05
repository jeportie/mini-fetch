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
/**
 * Generic helper to handle a fetch call safely.
 * @internal
 */
async function handleRequest(action, logger) {
    try {
        const data = await action();
        return { data, error: null };
    }
    catch (err) {
        const msg = `[API] ❌ ${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;
        logger.error?.(msg);
        return { data: null, error: err };
    }
}
/** Safe wrapper for GET requests */
export async function safeGet(API, url, opts, logger = console) {
    return handleRequest(() => API.get(url, opts), logger);
}
/** Safe wrapper for POST requests */
export async function safePost(API, url, body, opts, logger = console) {
    return handleRequest(() => API.post(url, body, opts), logger);
}
/** Safe wrapper for PUT requests */
export async function safePut(API, url, body, opts, logger = console) {
    return handleRequest(() => API.put(url, body, opts), logger);
}
/** Safe wrapper for DELETE requests */
export async function safeDelete(API, url, body, opts, logger = console) {
    return handleRequest(() => API.delete(url, body, opts), logger);
}
