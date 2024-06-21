import { IORNode, PropId } from "ortypes";
import { ORNodePropStatus, Proposal, ProposalFull } from "ortypes/ornode.js";
import { OrnodeClient, createOrnodeClient } from "./ornodeClient/index.js";
import { Input, Method, Path, Response } from "./ornodeClient/ornodeClient.js";

export class OrnodeReturnedError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class OrnodeRequestFailed extends Error {
  cause: unknown;

  constructor(msg: string, cause: unknown) {
    super(msg);
    this.cause = cause;
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
    try {
      console.debug("request: ", method, " ", path, " ", params);
      const response = await this.ornodeClient.provide(method, path, params);
      if (response.status === 'error') {
        throw new OrnodeReturnedError(response.error.message);
      }
      console.debug("response: ", response);
      return response.data;
    } catch (err) {
      throw new OrnodeRequestFailed(`Request ${method} ${path} with params: ${JSON.stringify(params)} failed. Cause: ${JSON.stringify(err)}`, err);
    }
  }



}