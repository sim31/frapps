
// TODO: Move to separate package, because this might be useful for other packages

export type SafeRecord<K extends keyof any, V> = Partial<Record<K, V>>;