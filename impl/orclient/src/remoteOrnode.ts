import { IORNode, PropId, ProposalInvalid, ProposalNotCreated, ProposalNotFound } from "ortypes";
import { ORNodePropStatus, Proposal, ProposalFull, zErrorType } from "ortypes/ornode.js";
import { OrnodeClient, createOrnodeClient } from "./ornodeClient/index.js";
import { Input, Method, Path, Response } from "./ornodeClient/ornodeClient.js";
import { stringify } from "ts-utils";

export class OrnodeUnknownErrResponse extends Error {
  fullErr: any;

  constructor(msg: string, fullErr: any) {
    super(msg);
    this.fullErr = fullErr;
  }
}

export class OrnodeRequestFailed extends Error {
  cause: unknown;

  constructor(msg: string, cause: unknown) {
    super(msg);
    this.cause = cause;
  }
}

export function discriminateError(error: any) {
  const msg = error.message ?? "";
  if (error.name !== undefined) {
    switch (error.name) {
      case zErrorType.Enum.ProposalNotFound: {
        return new ProposalNotFound(msg);
      }
      case zErrorType.Enum.ProposalNotCreated: {
        return new ProposalNotCreated(msg);
      }
      case zErrorType.Enum.ProposalInvalid: {
        return new ProposalInvalid(msg, error.cause);
      }
      default:
        return new OrnodeUnknownErrResponse(msg, error);
    }
  } else {
    return new OrnodeUnknownErrResponse(msg, error);
  }
}

export class RemoteOrnode implements IORNode {
  ornodeClient: OrnodeClient

  constructor(url: string) {
    this.ornodeClient = createOrnodeClient(url);
  }

  async putProposal(proposal: ProposalFull): Promise<ORNodePropStatus> {
    const data = await this._makeOrnodeRequest("post", "/v1/putProposal", { proposal });
    return data.propStatus;
  }

  async getProposal(id: PropId): Promise<Proposal> {
    const data = await this._makeOrnodeRequest("post", "/v1/getProposal", { propId: id });
    return data;
  }

  async getProposals(from: number, limit: number): Promise<Proposal[]> {
    const data = await this._makeOrnodeRequest("post", "/v1/getProposals", { from, limit });
    return data.proposals;
  }

  async getPeriodNum(): Promise<number> {
    const data = await this._makeOrnodeRequest("get", "/v1/getPeriodNum", {});
    return data.periodNum;
  }

  private async _makeOrnodeRequest<M extends Method, P extends Path>(
    method: M, path: P, params: Input[`${M} ${P}`]
  ): Promise<Extract<Response[`${M} ${P}`], { status: "success" }>["data"]> {
    let data: any;
    let error: any;
    try {
      console.debug("request: ", method, " ", path, " ", params);
      const response = await this.ornodeClient.provide(method, path, params);
      if (response.status === 'error') {
        error = discriminateError(response.error);
      } else {
        console.debug("response: ", response);
        data = response.data;
      }
    } catch (err) {
      throw new OrnodeRequestFailed(`Request ${method} ${path} with params: ${stringify(params)} failed. Cause: ${stringify(err)}`, err);
    }

    if (error !== undefined) {
      throw error;
    } else {
      return data;
    }
  }



}