// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   fetch.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 16:24:05 by jeportie          #+#    #+#             //
//   Updated: 2025/11/12 16:36:10 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import type { Logger } from "./logger.js";

export interface FetchOptions {
    getToken?: () => string | null;
    onToken?: (token: string | null) => void;
    refreshFn?: () => Promise<boolean>;
    logger?: Logger | Console;
    credentials?: RequestCredentials;
}

export interface FetchRequestInit extends RequestInit {
    headers?: HeadersInit; // ← native union: Headers | string[][] | Record<string,string>
}

export interface FetchResult<T = any> {
    data: T | null;
    error: Error | null;
}
