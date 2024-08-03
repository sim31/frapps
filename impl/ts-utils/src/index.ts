
/**
 * Like Record but forces you to check if entry you're trying to access exists.
 * Alternative for noUcheckedIndexedAccess.
 */
export type SafeRecord<K extends keyof any, V> = Partial<Record<K, V>>;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const stringify = (obj: any) => JSON.stringify(
  obj,
  (_, v) => typeof v === 'bigint' ? v.toString() : v, 
  2
);

export const deleteUndefined = (obj: any) => Object.keys(obj).forEach(key => {
  if (typeof obj[key] === 'object') {
    deleteUndefined(obj[key]);
  } else if (obj[key] === undefined) {
    delete obj[key];
  }
});

export function withoutUndefined<T extends object>(obj: T): T {
  let newObj: any = {};
  const o: any = obj;
  Object.keys(obj).forEach((key) => {
    if (typeof o[key] === 'object' && o[key] !== null) {
      newObj[key] = withoutUndefined(o[key]);
    } else if (o[key] !== undefined) {
      newObj[key] = o[key];
    }
  });
  return newObj as T;
}

export function withoutProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  const ret = {
    ...obj,
  }
  delete ret[key];
  return ret;
}


export { ErrorWithCause } from "./ErrorWithCause.js";

