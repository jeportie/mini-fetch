// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   logger.ts                                          :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/11/12 16:35:28 by jeportie          #+#    #+#             //
//   Updated: 2025/11/12 16:35:34 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Generic interface for any prefixed or standard logger.
 * Compatible with your frontend logger and native console.
 */
export interface Logger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    setLevel?: (level: LogLevel) => void;
    withPrefix?: (prefix: string) => Logger;
}
