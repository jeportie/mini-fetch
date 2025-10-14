// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   safeFetch.ts                                       :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 14:35:31 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 14:41:09 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { API } from "../api.js";
import { logger } from "../logger.js";

// ============================================================
// Shared Types
// ============================================================

export interface SafeResult<T = any> {
    data: T | null;
    error: Error | null;
}

export interface SafeRequestOptions {
    url: string;
    body?: object;
}

// mini-fetch/auth/SafeFetch.js
export async function safePost(API, url, body, logger = console) {
    try {
        const data = await API.post(url, body);
        return { data, error: null };
    } catch (err) {
        const msg = `[API] ❌ ${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;
        logger.error?.(msg, err);
        return { data: null, error: err };
    }
}

export async function safeGet(API, url, logger = console) {
    try {
        const data = await API.get(url);
        return { data, error: null };
    } catch (err) {
        const msg = `[API] ❌ ${err.code || err.status || "Error"}: ${err.message || "Unknown error"}`;
        logger.error?.(msg, err);
        return { data: null, error: err };
    }
}
