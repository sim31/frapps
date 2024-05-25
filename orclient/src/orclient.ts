import { Optional } from "utility-types";
// TODO: Probably won't work for browser builds
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers.js";
import {
  Account,
  EthAddress,
  Stage,
  VoteStatus,
  VoteType,
  ExecStatus,
  TokenId,
  PropId,
  PropType,
  zExecStatus,
  zStage,
  zVoteStatus,
  zProposalState,
  zMintRespectGroupArgs,
  zPropType,
  zEthAddress,
  zMeetingNum,
  zGroupNum,
  zRankings,
  zMintType,
  zUint,
  zTokenId,
  zBytes,
  zPropId,
} from "./common.js";
import { IORNode, zPropContent } from "./ornode.js";
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import Rf from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { BigNumberish, isBytesLike } from "ethers";
import { Result } from "../node_modules/ethers/lib.commonjs/index.js";
import { unpackTokenId } from "op-fractal-sc/utils/tokenId.js";
import { expect } from 'chai';
import { z } from "zod";

type Signer = HardhatEthersSigner;

export const zProposalMetadata = z.object({
  propTitle: z.string().optional(),
  propDescription: z.string().optional()
})
export type ProposalMetadata = z.infer<typeof zProposalMetadata>;

export const zDecodedPropBase = z.object({
  propType: zPropType
})
export type DecodedPropBase = z.infer<typeof zDecodedPropBase>;

const zBreakoutResult = z.object({
  groupNum: zGroupNum,
  rankings: zRankings
});
export type BreakoutResult = z.infer<typeof zBreakoutResult>;

export const zRespectBreakout = zDecodedPropBase.merge(zBreakoutResult).extend({
  propType: z.literal(zPropType.Enum.respectBreakout),
  meetingNum: zMeetingNum,
});
export type RespectBreakout = z.infer<typeof zRespectBreakout>;

export const zRespectAccount = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.respectAccount),
  meetingNum: zMeetingNum,
  mintType: zMintType,
  account: zEthAddress,
  value: zUint,
  title: z.string(),
  reason: z.string()
});
export type RespectAccount = z.infer<typeof zRespectAccount>;

export const zRespectAccountRequest = zRespectAccount.omit({ propType: true }).extend({
  mintType: zMintType.optional(),
  meetingNum: zMeetingNum.optional()
});
export type RespectAccountRequest = z.infer<typeof zRespectAccountRequest>;

export const zBurnRespect = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.burnRespect),
  tokenId: zTokenId,
  reason: z.string()
})
export type BurnRespect = z.infer<typeof zBurnRespect>;

export const zCustomSignal = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customSignal),
  data: zBytes
});
export type CustomSignal = z.infer<typeof zCustomSignal>;

export const zTick = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.tick),
  data: zBytes
})
export type Tick = z.infer<typeof zTick>;

export const zCustomCall = zDecodedPropBase.extend({
  propType: z.literal(zPropType.Enum.customCall)
});
export type CustomCall = z.infer<typeof zCustomCall>;

export const zDecodedProposal = z.union([
  zCustomCall,
  zTick,
  zCustomSignal,
  zBurnRespect,
  zRespectAccount,
  zRespectBreakout
]);
export type DecodedProposal = z.infer<typeof zDecodedProposal>;

export const zProposal = zProposalState.extend({
  id: zPropId,
  address: zEthAddress.optional(),
  cdata: zBytes.optional(),
  stage: zStage,
  voteStatus: zVoteStatus,
  decoded: zDecodedProposal.optional(),
  createTime: z.date()
})
export type Proposal = z.infer<typeof zProposal>;

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.message = message + " has not yet been implemented.";
  }
}

export class VoteEnded extends Error {
  constructor(stage?: Stage, message?: string) {
    super(message);
    this.message = `Vote has ended. Currenct stage: ${stage}. Message: ${message}`;
  }
}

export class ProposalFailed extends Error {
  constructor(message?: string) {
    super(message);
    this.message = `Proposal has failed. Message: ${message}`;
  }
}

export interface Config {
  // eth: string;
  ornode: IORNode;
  signer: Signer;
  orec: Orec;
  newRespect: Respect1155;
}

export type ProposalState = Awaited<ReturnType<Orec["proposals"]>>

export function isPropCreated(propState: ProposalState) {
  return propState.createTime > 0n;
}

export default class ORClient {
  private _config: Config;
  private _newRespectAddr?: EthAddress;

  constructor(config: Config) {
    this._config = config;
    this._newRespectAddr = await config.newRespect.getAddress();
  }

  static async createORClient(config: Config): Promise<ORClient> {
    const client = new ORClient(config);
    client._config = config;
    return client;
  }

  connect(signer: Signer): ORClient {
    const newCl = Object.create(this);
    newCl._config.signer = signer;
    return newCl;
  }

  private async _getProposalFromChain(id: PropId): Promise<Proposal> {
    const propState = zProposalState.parse(await this._config.orec.proposals(id));
    const stage = zStage.parse(await this._config.orec.getStage(id));
    const voteStatus = zVoteStatus.parse(await this._config.orec.getVoteStatus(id));

    const r: Proposal = {
      id: id,
      createTime: new Date(Number(propState.createTime) * 1000),
      yesWeight: propState.yesWeight,
      noWeight: propState.noWeight,
      status: zExecStatus.parse(propState.status),
      stage,
      voteStatus,
    }

    return r;
  }

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    const prop = await this._getProposalFromChain(id);
    const nodeProp = await this._config.ornode.getProposal(id);

    if (nodeProp.content !== undefined) {
      prop.address = nodeProp.content.address;
      prop.cdata = nodeProp.content.cdata;

      if (nodeProp.attachment !== undefined) {
        let decoded: DecodedProposal;
        switch (nodeProp.attachment.propType) {
          case 'respectBreakout': {
            const content = zPropContent.extend({
              address: z.literal(this._newRespectAddr)
            }).parse(nodeProp.content);
            z.literal(this._newRespectAddr);
            if (prop.content.address !== this._newRespectAddr) {
              throw new Error("respectBreakout proposal for unexpected contract")
            }
            const iface = this._config.newRespect.interface;
            const tx = iface.parseTransaction({ data: prop.content.cdata });
            if (tx === null) {
              throw new Error("Failed parsing transaction");
            }
            const f = iface.getFunction('mintRespectGroup');
            expect(tx.name).to.be.equal(f.name);
            const args = parseMintRespectGroupArgs(tx.args);

            const mintReqs = args[0] as Respect1155.MintRequestStruct[];
            for (const req of mintReqs) {
              const tokenId = unpackTokenId(req.id);
              // TODO: use assertion library to check what you expect
              // Maybe just use chai;
              // ... or zod - it is better because it does compile time checking (e.g.: if you check for undefined the code after that will know it)
              expect(tokenId.mintType).to.be.equal(0);
            }
            
            // TODO: don't forget to add memo

            break;
          }
          case 'respectAccount': {
            break;
          }
          case 'burnRespect': {
            break;
          }
          case 'customSignal': {
            break;
          }
          case 'tick': {
            break;
          }
          case 'customCall': {
            break;
          }
          default: {
            const exhaustiveCheck: never = prop.attachment;
          }
        }

      }
    }

    if (nodeProp.attachment !== undefined && nodeProp.content !== undefined) {


    }
  }

  // UC8
  /**
   * Returns a list of proposals ordered from latest to oldest
   * @param from - Start of proposal range. 0 - last proposal, 1 - second to  last proposal and so on
   * @param count - Number of proposals to return
   */
  async lsProposals(from: number = 0, limit: number = 50): Promise<Proposal[]> {
    return []
  }

  // UC2
  async vote(propId: PropId, vote: VoteType, memo?: string) {}
  // UC3
  async execute(propId: PropId) {}

  // UC{1,4}
  async submitBreakoutResult(result: BreakoutResult, metadata?: ProposalMetadata): Promise<Proposal> {
    // Send proposal
    throw new NotImplemented("submitBreakoutResult");
  }
  // UC5
  async proposeRespectTo(req: RespectAccountRequest, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeRespectTo");
  }
  // UC6
  async burnRespect(
    tokenId: TokenId,
    reason: string,
    metadata?: ProposalMetadata
  ): Promise<Proposal> {
    throw new NotImplemented("burnRespect");
  }
  // UC7
  async proposeTick(data?: string, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeTick");
  }
  async proposeCustomSignal(data: string, metadata?: ProposalMetadata): Promise<Proposal> {
    throw new NotImplemented("proposeCustomSignal");
  }

  async getPeriodNum(): Promise<number> {
    return 0;
  }
  async getNextMeetingNum(): Promise<number> {
    return 0;
  }
  async getLastMeetingNum(): Promise<number> {
    return 0;
  }

  // TODO: function to list respect NTTs
}