import { z } from "zod";
import {
  createResultHandler,
  IOSchema,
  getStatusCodeFromError,
  getMessageFromError,
} from "express-zod-api";

const zError = z.object({
  message: z.string(),
  name: z.string().default("")
});

export const resultHandler = createResultHandler({
  getPositiveResponse: (output: IOSchema) => ({
    schema: z.object({ status: z.literal("success"), data: output }),
    mimeType: "application/json", // optinal, or mimeTypes for array
  }),
  getNegativeResponse: () => z.object({
    status: z.literal("error"),
    error: zError
  }),
  handler: ({ error, input, output, request, response, logger }) => {
    if (!error) {
      response.status(200).json({
        status: "success",
        data: output
      });
      return;
    }

    const statusCode = getStatusCodeFromError(error);
    const message = getMessageFromError(error);
    console.debug("Returning error: ", error);
    response.status(statusCode).json({
      status: "error",
      error: {
        message,
        name: error.name
      }
    })
    return;
  },
});