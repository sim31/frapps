
export class NotImplementedError extends Error {
  constructor(featName: string) {
    const msg = `${featName} has not yet been implemented.`;
    super(msg);
  }
}