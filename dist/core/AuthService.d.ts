import { AuthOptions } from "../types/auth.js";
/**
 * Generic authentication service.
 * - Stores and retrieves JWT tokens.
 * - Persists a "has session" flag in localStorage.
 * - Can auto-refresh using a caller-provided refreshFn.
 * - Logs through a configurable logger (default = console).
 */
export declare class AuthService {
    private token;
    private storageKey;
    private refreshFn?;
    private logger;
    constructor({ storageKey, refreshFn, logger }?: AuthOptions);
    initFromStorage(): Promise<boolean>;
    isLoggedIn(): boolean;
    getToken(): string | null;
    setToken(token: string | null): void;
    clear(): void;
    isTokenExpired(skewSec?: number): boolean;
}
