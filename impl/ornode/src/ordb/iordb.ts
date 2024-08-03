import { IAwardStore } from "./iawardStore.js";
import { IProposalStore } from "./iproposalStore.js";
import { ITickStore } from "./itickStore.js";

export interface IOrdb {
  awards: IAwardStore;
  proposals: IProposalStore;
  ticks: ITickStore;
}
