import { 
  BigNumberish,
  toBeHex,
  hexlify,
  toNumber,
  concat,
  zeroPadValue,
  dataSlice,
  toBeArray,
  ZeroAddress,
  isAddress,
  getNumber
} from 'ethers';

export type TokenIdData = {
  periodNumber: BigNumberish;
  owner: string;
  mintType: BigNumberish;
}
export type TokenId = BigNumberish;

export function normTokenIdData(data: TokenIdData): TokenIdData {
  return {
    mintType: toBeHex(data.mintType),
    periodNumber: toBeHex(data.periodNumber, 8),
    owner: hexlify(data.owner.toString())
  }
}

export function tokenIdDataEq(
  data1: TokenIdData,
  data2: TokenIdData
): boolean {
  return (
    toNumber(data1.mintType) === toNumber(data2.mintType) &&
    toNumber(data1.periodNumber) === toNumber(data2.periodNumber) &&
    data1.owner.toString() === data2.owner.toString()
  );
}


export function packTokenId(data: TokenIdData): TokenId {
  const mintTypeHex = toBeHex(data.mintType);
  const periodNumberHex = toBeHex(data.periodNumber, 8);
  const r = concat([
    "0x000000",
    mintTypeHex,
    periodNumberHex,
    data.owner
  ]);
  return r;
}

export function unpackTokenId(tokenId: TokenId): TokenIdData {
  const bytes = zeroPadValue(toBeArray(tokenId), 32);
  const mintType = dataSlice(bytes, 3, 4);
  const periodNumber = dataSlice(bytes, 4, 12);
  const owner = dataSlice(bytes, 12, 32);
  return {
    mintType, periodNumber, owner
  };
}

export function isTokenIdDataValid(td: TokenIdData): boolean {
  return td.owner !== ZeroAddress
    && isAddress(td.owner)
    && getNumber(td.periodNumber) >= 0
    && getNumber(td.mintType) >= 0;
}

export function isTokenIdValid(tokenId: TokenId | TokenIdData): boolean {
  if (typeof tokenId === 'object') {
    return isTokenIdDataValid(tokenId);
  } else {
    try {
      const tid = unpackTokenId(tokenId);
      return isTokenIdDataValid(tid);
    } catch {
      return false;
    }
  }
}

export const value = 10;