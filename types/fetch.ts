// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   fetch.ts                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 16:24:05 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:24:07 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export interface FetchOptions {
    getToken?: () => string | null;
    onToken?: (token: string | null) => void;
    refreshFn?: () => Promise<boolean>;
    logger?: Console;
}

export interface FetchRequestInit extends RequestInit {
    headers?: Record<string, string>;
}

export interface FetchResult<T = any> {
    data: T | null;
    error: Error | null;
}
