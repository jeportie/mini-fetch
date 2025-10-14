export interface SafeResult<T = any> {
    data: T | null;
    error: Error | null;
}
