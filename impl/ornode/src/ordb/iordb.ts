import { IAwardStore } from "./iawardStore.js";
import { IProposalStore } from "./iproposalStore.js";
import { ITickStore } from "./itickStore.js";
import { IVoteStore } from "./ivoteStore.js";

export interface IOrdb {
  awards: IAwardStore;
  proposals: IProposalStore;
  ticks: ITickStore;
  votes: IVoteStore;
}
