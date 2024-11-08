import { getAddress, getBigInt, hexlify, isBytesLike, isHexString, toBeHex, ZeroAddress } from 'ethers';
import { z } from "zod";
import { addCustomIssue } from './zErrorHandling.js';

export const zTxHash = z.string();
export type TxHash = z.infer<typeof zTxHash>;

function _isHexString(value: any, length?: number | boolean): boolean {
  return isHexString(value, length);
}

export const zBytes = z.string().refine((val) => {
  return _isHexString(val);
});
export type Bytes = z.infer<typeof zBytes>;

export const zBytes32 = z.string().refine((val) => {
  return _isHexString(val, 32);
}).pipe(z.string());
export type Bytes32 = z.infer<typeof zBytes32>;

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

export const EthZeroAddress = ZeroAddress;

export function isEthAddr(val: any): val is EthAddress {
  try {
    zEthAddress.parse(val);
    return true;
  } catch (err) {
    return false;
  }
}

export const zEthNonZeroAddress = zEthAddress.refine((val) => {
  return val !== ZeroAddress;
});

export const zEthZeroAddress = zEthAddress.refine((val) => {
  return val === ZeroAddress;
});

export function isEthNonZeroAddr(val: any): boolean {
  try {
    zEthNonZeroAddress.parse(val);
    return true;
  } catch (err) {
    return false;
  }
}

export function isEthZeroAddr(val: any): boolean {
  try {
    zEthZeroAddress.parse(val);
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

export const zBigIntToBytes32 = z.bigint().transform(val => {
  return toBeHex(val, 32);
}).pipe(zBytes32);

