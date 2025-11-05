import { SafeResult } from "../types/result.js";
import Fetch from "./Fetch.js";
/** Safe wrapper for GET requests */
export declare function safeGet<T = any>(API: Fetch, url: string, opts?: RequestInit, logger?: Console): Promise<SafeResult<T>>;
/** Safe wrapper for POST requests */
export declare function safePost<T = any>(API: Fetch, url: string, body?: object, opts?: RequestInit, logger?: Console): Promise<SafeResult<T>>;
/** Safe wrapper for PUT requests */
export declare function safePut<T = any>(API: Fetch, url: string, body?: object, opts?: RequestInit, logger?: Console): Promise<SafeResult<T>>;
/** Safe wrapper for DELETE requests */
export declare function safeDelete<T = any>(API: Fetch, url: string, body?: object, opts?: RequestInit, logger?: Console): Promise<SafeResult<T>>;
