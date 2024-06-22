import { EndpointsFactory } from "express-zod-api";
import { z } from "zod";
import { Routing } from "express-zod-api";
import { MemOrnode } from "./memOrnode.js";
import { config } from "./config.js";
import { zORNodePropStatus, zProposal, zProposalFull } from "ortypes/ornode.js";
import { zPropId } from "ortypes";
import { resultHandler } from "./resultHandler.js";

const ornode = MemOrnode.create({
  newRespect: config.contracts.newRespect,
  orec: config.contracts.orec,
  providerUrl: config.providerUrl
});

async function getOrnode() {
  return await ornode;
}

const factory = new EndpointsFactory(resultHandler);

const putProposal = factory.build({
  method: "post",
  // All inputs have to be `posts` for some reason
  input: z.object({ proposal: zProposalFull }),
  output: z.object({
    propStatus: zORNodePropStatus
  }),
  handler: async ({ input, options, logger }) => {
    logger.debug(`putProposal ${JSON.stringify(input)}. options: ${JSON.stringify(options)}`);
    const n = await getOrnode();
    const propStatus = await n.putProposal(input.proposal);
    return { propStatus }
  },
});

const getPeriodNum = factory.build({
  method: "get",
  input: z.object({}),
  output: z.object({ periodNum: z.number() }),
  handler: async ({ input, options, logger }) => {
    logger.debug(`getPeriodNumber ${JSON.stringify(input)}. options: ${JSON.stringify(options)}`);
    const n = await getOrnode();
    const periodNum = await n.getPeriodNum();
    return { periodNum };
  },
})

const getProposal = factory.build({
  method: "post",
  input: z.object({ propId: zPropId }),
  output: zProposal,
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposal ${JSON.stringify(input)}. options: ${JSON.stringify(options)}`);
    const n = await getOrnode();
    return await n.getProposal(input.propId);
  }
});

const getProposals = factory.build({
  method: "post",
  input: z.object({
    from: z.number(),
    limit: z.number()
  }),
  output: z.object({
    proposals: z.array(zProposal)
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposals ${JSON.stringify(input)}. options: ${JSON.stringify(options)}`);
    const n = await getOrnode();
    const proposals = await n.getProposals(input.from, input.limit);
    return { proposals };
  }
})

export const routing: Routing = {
  v1: {
    putProposal,
    getProposal,
    getProposals,
    getPeriodNum
  },
};
