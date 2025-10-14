// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   guards.ts                                          :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: jeportie <jeportie@42.fr>                  +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/09/15 13:44:06 by jeportie          #+#    #+#             //
//   Updated: 2025/10/14 16:34:54 by jeportie         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //
export function requireAuth(auth, { loginPath = "/login", checkSessionFn, logger = console } = {}) {
    return async function (ctx) {
        logger.info?.("[Guard] Checking auth for:", ctx?.path);
        const wanted = `${ctx?.path || location.pathname}${location.search || ""}${location.hash || ""}`;
        const next = encodeURIComponent(wanted);
        if (!auth.isLoggedIn()) {
            logger.warn?.("[Guard] Not logged in.");
            return `${loginPath}?next=${next}`;
        }
        if (auth.isTokenExpired()) {
            logger.info?.("[Guard] Token expired, refreshing...");
            const ok = await auth.initFromStorage();
            if (!ok) {
                logger.warn?.("[Guard] Refresh failed");
                return `${loginPath}?next=${next}`;
            }
        }
        if (typeof checkSessionFn === "function") {
            try {
                if (await checkSessionFn()) {
                    logger.info?.("[Guard] Session check OK");
                    return true;
                }
                logger.warn?.("[Guard] Session check failed");
            }
            catch (err) {
                logger.error?.("[Guard] checkSessionFn exception:", err);
            }
            auth.clear();
            return `${loginPath}?next=${next}`;
        }
        return true;
    };
}
/** Block navigation to /api/ routes */
export function onBeforeNavigate(to) {
    return !to.startsWith("/api/");
}
