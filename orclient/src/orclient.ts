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
  toExecStatus,
  toStage,
  toVoteStatus
} from "./common.js";
import { IORNode } from "./ornode.js";
import { Orec } from "orec/typechain-types/contracts/Orec.js";
import Rf from "respect-sc/typechain-types/factories/contracts/Respect1155__factory.js";
import { Respect1155 } from "respect-sc/typechain-types/contracts/Respect1155.js";
import { BigNumberish, isBytesLike } from "ethers";
import { Result } from "../node_modules/ethers/lib.commonjs/index.js";
import { unpackTokenId } from "op-fractal-sc/utils/tokenId.js";
import { expect } from 'chai';

type Signer = HardhatEthersSigner;

export interface ProposalMetadata {
  propTitle?: string;
  propDescription?: string;
}

export interface DecodedProposalBase extends ProposalMetadata {
  propType: PropType;
}

export interface RespectBreakout extends DecodedProposalBase {
  propType: "respectBreakout",
  meetingNum: number,
  groupNum: number,
  rankings: Account[6],
}

export interface RespectAccount extends DecodedProposalBase {
  propType: "respectAccount",
  meetingNum: number,
  mintType: number,
  account: Account,
  value: number,
  title: string
  reason: string,
}

export type RespectAccountRequest = Optional<Omit<RespectAccount, 'propType'>, 'meetingNum' | 'mintType'>;

export interface BurnRespect extends DecodedProposalBase {
  propType: "burnRespect"
  tokenId: TokenId,
  reason: string
}

export interface CustomSignal extends DecodedProposalBase {
  propType: "customSignal"
  data: string
}

export interface Tick extends DecodedProposalBase {
  propType: "tick",
  data?: string
}

export type DecodedProposal =
  RespectBreakout | RespectAccountRequest | BurnRespect | CustomSignal | Tick;

export interface Proposal {
  id: PropId;
  address?: string;
  cdata?: string;
  memo?: string,
  yesWeight: bigint;
  noWeight: bigint;
  createTime: Date;
  execStatus: ExecStatus;
  stage: Stage;
  voteStatus: VoteStatus;
  decoded?: DecodedProposal
}

export interface BreakoutResult {
  groupNum: number;
  rankings: [
    Account, Account, Account, Account, Account, Account
  ]
}

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

function parseMintRespectGroupArgs(txArgs: Result): Parameters<Respect1155["mintRespectGroup"]> {
  const requests = txArgs["requests"]
  const data = txArgs["data"];
  if (!(requests instanceof Array) || !isBytesLike(data)) {
    throw new TypeError("invalid arguments")
  }

  const mRequests: Respect1155.MintRequestStruct[] = requests.map(val => {
    if (val["id"] === undefined || val["value"] === undefined) {
      throw new TypeError("id or value missing in mint request struct");
    }
    return {
      id: val["id"] as BigNumberish,
      value: val["value"] as BigNumberish
    }
  });

  const args: Parameters<Respect1155["mintRespectGroup"]> = [
    mRequests,
    data,
  ]
  return args;
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

  /**
   * Returns proposal by id
   * @param id - proposal id
   */
  async getProposal(id: PropId): Promise<Proposal> {
    const prop = await this._config.ornode.getProposal(id);

    const propState = await this._config.orec.proposals(id);
    if (propState.createTime === 0n) {
      throw new Error("Proposal does not exist onchain");
    }

    const stage = toStage(await this._config.orec.getStage(id));
    const voteStatus = toVoteStatus(await this._config.orec.getVoteStatus(id));

    const r: Proposal = {
      id: prop.id,
      address: prop.content?.address,
      cdata: prop.content?.cdata,
      createTime: new Date(Number(propState.createTime) * 1000),
      yesWeight: propState.yesWeight,
      noWeight: propState.noWeight,
      execStatus: toExecStatus(propState.status),
      stage,
      voteStatus,
    }

    if (prop.attachment !== undefined && prop.content !== undefined) {
      let decoded: DecodedProposal;
      switch (prop.attachment.propType) {
        case 'respectBreakout': {
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