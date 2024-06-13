import { ContractTransactionResponse, TransactionReceipt } from "ethers";
import { DecodedError } from "ethers-decode-error";
import { Proposal as NProp } from "ortypes/ornode.js"

export class NotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.message = message + " has not yet been implemented.";
  }
}

export class TxFailed extends Error {
  public decodedError?: DecodedError
  public receipt?: TransactionReceipt;

  constructor(
    response: ContractTransactionResponse,
    receipt: TransactionReceipt | null,
    message?: string
  );
  constructor(cause: unknown, decodedErr?: DecodedError, message?: string);
  constructor(
    responseOrCause: ContractTransactionResponse | unknown,
    receiptOrDec: TransactionReceipt | null | DecodedError| undefined,
    message?: string
  ) {
    const msg = `Transaction failed. Message: ${message}. responseOrCause: ${JSON.stringify(responseOrCause)}. receiptOrDecodedError: ${JSON.stringify(receiptOrDec)}`;
    super(msg);
    this.name = 'TxFailed';
    if (typeof receiptOrDec === 'object' && receiptOrDec !== null) {
      if ('name' in receiptOrDec) {
        this.decodedError = receiptOrDec;
      } else {
        this.receipt = receiptOrDec;
      }
    }
  }
}

/**
 * Thrown if orclient failed to push proposal to ornode
 */
export class PutProposalFailure extends Error {
  constructor(nprop: NProp, cause: any, msg?: string) {
    const m = `Failed submitting proposal to ornode. Proposal: ${JSON.stringify(nprop)}. Cause: ${cause}. msg: ${msg}`;
    super(m);
    this.name = 'PutProposalFailure';
  }

}