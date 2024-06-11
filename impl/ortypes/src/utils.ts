import { Result } from "ethers";
import { z } from "zod";

export function resultArrayToObj<T extends z.AnyZodObject>(val: unknown, baseZObj: T) {
  if (Array.isArray(val)) {
    const keys = Object.keys(baseZObj.keyof().Values);
    const res = Result.fromItems(val, keys);
    return res.toObject();
  } else {
    return val;
  }
}

export function preprocessResultOrObj<T extends z.AnyZodObject>(baseZObj: T) {
  return z.preprocess(val => resultArrayToObj(val, baseZObj), baseZObj)
}
