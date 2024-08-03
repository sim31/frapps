import { PropId } from "ortypes";
import { GetProposalsSpec, zProposalBase } from "ortypes/ornode.js";
import { z } from "zod";

export * from "ortypes/ornode.js";

export const zProposal = zProposalBase.required({
  createTs: true
});
export type Proposal = z.infer<typeof zProposal>;

export interface IProposalStore {
  getProposal: (id: PropId) => Promise<Proposal | null>;

  /**
   * Returns proposals ordered from oldest to newest
   */
  getProposals: (spec: GetProposalsSpec) => Promise<Proposal[]>;

  createProposal: (prop: Proposal) => Promise<void>;

  updateProposal: (id: PropId, prop: Partial<Proposal>) => Promise<void>;

  deleteProp: (id: PropId) => Promise<void>;
}