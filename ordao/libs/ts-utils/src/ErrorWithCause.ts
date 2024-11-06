
export class ErrorWithCause extends Error {
  cause: any;

  constructor(msg: string, cause_: any) {
    super(msg);
    this.cause = cause_;
  }
}