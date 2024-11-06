import { z } from "zod";

// https://eips.ethereum.org/EIPS/eip-7572
export const zContractMetadata = z.object({
  name: z.string().describe("Name of contract"),
  symbol: z.string().optional().describe("Symbol of contract"),
  description: z.string().optional().describe("Description of contract"),
  image: z.string().url().optional(),
  banner_image: z.string().url().optional(),
  featured_image: z.string().url().optional(),
  external_link: z.string().url().optional(),
  collaborators: z.array(z.string()).optional()
})

export type ContractMetadata = z.infer<typeof zContractMetadata>;