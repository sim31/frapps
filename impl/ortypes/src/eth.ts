import { getAddress, getBigInt, hexlify, isBytesLike, isHexString } from 'ethers';
import { z } from "zod";
import { addCustomIssue } from './zErrorHandling.js';

export const zBytes = z.string().refine((val) => {
  return isHexString(val);
});
export type Bytes = z.infer<typeof zBytes>;

export const zBytes32 = z.string().refine((val) => {
  return isHexString(val, 32);
})

export const zBytesLike = z.string().or(z.instanceof(Uint8Array))
  .superRefine((val, ctx) => {
    if (isBytesLike(val)) {
      return true;
    } else {
      addCustomIssue(val, ctx, "Invalid bytes like value");
    }
  });

export const zBytesLikeToBytes = zBytesLike.transform((val, ctx) => {
  return hexlify(val);
}).pipe(zBytes);

export const zEthAddress = z.string().transform((val) => {
  return getAddress(val);
});
export type EthAddress = z.infer<typeof zEthAddress>;
export type Account = EthAddress

export function isEthAddr(val: any): val is EthAddress {
  try {
    zEthAddress.parse(val);
    return true;
  } catch (err) {
    return false;
  }
}

export const zNonZeroBigInt = z.bigint().nonnegative().or(z.bigint().nonpositive());

export const zNonZeroNumber = z.number().nonnegative().or(z.number().nonpositive());

export const zBigNumberish = z.coerce.bigint();

export const zUint = z.bigint().gt(0n);

export const zUint8 = z.coerce.number().gte(0).lte(255);

export const zBigNumberishToBigint = zBigNumberish.transform((val, ctx) => {
  return getBigInt(val);
}).pipe(z.bigint());


