import { AuthService } from "./AuthService.js";
export interface GuardContext {
    path?: string;
}
export interface RequireAuthOptions {
    loginPath?: string;
    checkSessionFn?: () => Promise<boolean>;
    logger?: Console;
}
export declare function requireAuth(auth: AuthService, { loginPath, checkSessionFn, logger }?: RequireAuthOptions): (ctx: GuardContext) => Promise<true | string>;
/** Block navigation to /api/ routes */
export declare function onBeforeNavigate(to: string): boolean;
