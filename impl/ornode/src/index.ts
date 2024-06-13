import { createConfig } from "express-zod-api";
import { defaultEndpointsFactory } from "express-zod-api";
import { z } from "zod";
import { Routing } from "express-zod-api";
import { createServer } from "express-zod-api";

const config = createConfig({
  server: {
    listen: 8090, // port, UNIX socket or options
  },
  cors: true,
  logger: { level: "debug", color: true },
});

const helloWorldEndpoint = defaultEndpointsFactory.build({
  method: "get", // or methods: ["get", "post", ...]
  input: z.object({
    // for empty input use z.object({})
    name: z.string().optional(),
  }),
  output: z.object({
    greetings: z.string(),
  }),
  handler: async ({ input: { name }, options, logger }) => {
    logger.debug("Options:", options); // middlewares provide options
    return { greetings: `Hello, ${name || "World"}. Happy coding!!! aa` };
  },
});

const routing: Routing = {
  v1: {
    hello: helloWorldEndpoint,
  },
};

createServer(config, routing);