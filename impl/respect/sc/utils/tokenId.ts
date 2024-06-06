import { BigNumberish } from 'ethers';
import { Respect1155 } from '../typechain-types/contracts/Respect1155';
import { ethers } from 'hardhat';

export type TokenIdData = {
  periodNumber: BigNumberish;
  owner: string;
  mintType: BigNumberish;
}
export type TokenId = BigNumberish;

export function normTokenIdData(data: TokenIdData): TokenIdData {
  return {
    mintType: ethers.toBeHex(data.mintType),
    periodNumber: ethers.toBeHex(data.periodNumber, 8),
    owner: ethers.hexlify(data.owner.toString())
  }
}

export function tokenIdDataEq(
  data1: TokenIdData,
  data2: TokenIdData
): boolean {
  return (
    ethers.toNumber(data1.mintType) === ethers.toNumber(data2.mintType) &&
    ethers.toNumber(data1.periodNumber) === ethers.toNumber(data2.periodNumber) &&
    data1.owner.toString() === data2.owner.toString()
  );
}


export function packTokenId(data: TokenIdData): TokenId {
  const mintTypeHex = ethers.toBeHex(data.mintType);
  const periodNumberHex = ethers.toBeHex(data.periodNumber, 8);
  const r = ethers.concat([
    "0x000000",
    mintTypeHex,
    periodNumberHex,
    data.owner
  ]);
  return r;
}

export function unpackTokenId(tokenId: TokenId): TokenIdData {
  const bytes = ethers.zeroPadValue(ethers.toBeArray(tokenId), 32);
  const mintType = ethers.dataSlice(bytes, 3, 4);
  const periodNumber = ethers.dataSlice(bytes, 4, 12);
  const owner = ethers.dataSlice(bytes, 12, 32);
  return {
    mintType, periodNumber, owner
  };
}

export function isTokenIdDataValid(td: TokenIdData): boolean {
  return td.owner !== ethers.ZeroAddress
    && ethers.isAddress(td.owner)
    && ethers.getNumber(td.periodNumber) >= 0
    && ethers.getNumber(td.mintType) >= 0;
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