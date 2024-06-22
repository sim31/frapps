import { z } from "zod";

export const zUrl = z.string().url();
export type Url = z.infer<typeof zUrl>;

export class InvalidArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArgumentError';
  }
}
