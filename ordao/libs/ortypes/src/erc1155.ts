import { z } from "zod";
import { zBytes32 } from "./eth.js";

export const zTokenId = zBytes32;
export type TokenId = z.infer<typeof zTokenId>;

/**
 * ERC1155 metadata. https://eips.ethereum.org/EIPS/eip-1155#metadata
 */
export const zErc1155Mt = z.object({
  name: z.string().optional(),
  decimals: z.number().int().gte(0).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  properties: z.object({}).optional()
});
/**
 * ERC1155 metadata. https://eips.ethereum.org/EIPS/eip-1155#metadata
 */
export type Erc1155Mt = z.infer<typeof zErc1155Mt>;

// TODO: check
z.string().url().parse("ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX");
