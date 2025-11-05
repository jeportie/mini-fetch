// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   fetch.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 16:24:05 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:51:20 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export interface FetchOptions {
    getToken?: () => string | null;
    onToken?: (token: string | null) => void;
    refreshFn?: () => Promise<boolean>;
    logger?: Console;
    credentials?: RequestCredentials;
}

export interface FetchRequestInit extends RequestInit {
    headers?: HeadersInit; // ← native union: Headers | string[][] | Record<string,string>
}

export interface FetchResult<T = any> {
    data: T | null;
    error: Error | null;
}
