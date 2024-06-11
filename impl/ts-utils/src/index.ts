
/**
 * Like Record but forces you to check if entry you're trying to access exists.
 * Alternative for noUcheckedIndexedAccess.
 */
export type SafeRecord<K extends keyof any, V> = Partial<Record<K, V>>;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));