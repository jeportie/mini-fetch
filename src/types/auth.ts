// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   auth.ts                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/10/14 16:24:14 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:24:16 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export interface AuthOptions {
    storageKey?: string;
    refreshFn?: () => Promise<string | null>;
    logger?: Console;
}
