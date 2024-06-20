import { defaultEndpointsFactory } from "express-zod-api";
import { z } from "zod";
import { Routing } from "express-zod-api";
import { ORNodeMemImpl } from "./ornodeMemImpl.js";
import { config } from "./config.js";
import { zORNodePropStatus, zProposal, zProposalFull } from "ortypes/ornode.js";
import { zPropId } from "ortypes";

const ornode = ORNodeMemImpl.createORNodeMemImpl({
  newRespect: config.contracts.newRespect,
  orec: config.contracts.orec,
  providerUrl: config.providerUrl
});

async function getOrnode() {
  return await ornode;
}

const putProposal = defaultEndpointsFactory.build({
  method: "post",
  // All inputs have to be `posts` for some reason
  input: z.object({ proposal: zProposalFull }),
  output: z.object({
    propStatus: zORNodePropStatus
  }),
  handler: async ({ input, options, logger }) => {
    logger.debug(`putProposal ${input}. options: ${options}`);
    const n = await getOrnode();
    const propStatus = await n.putProposal(input.proposal);
    return { propStatus }
  },
});

const getPeriodNum = defaultEndpointsFactory.build({
  method: "get",
  input: z.object({}),
  output: z.object({ periodNum: z.number() }),
  handler: async ({ input, options, logger }) => {
    logger.debug(`getPeriodNumber ${input}. options: ${options}`);
    const n = await getOrnode();
    const periodNum = await n.getPeriodNum();
    return { periodNum };
  },
})

const getProposal = defaultEndpointsFactory.build({
  method: "post",
  input: z.object({ propId: zPropId }),
  output: zProposal,
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposal ${input}. options: ${options}`);
    const n = await getOrnode();
    return await n.getProposal(input.propId);
  }
});

const getProposals = defaultEndpointsFactory.build({
  method: "post",
  input: z.object({
    from: z.number(),
    limit: z.number()
  }),
  output: z.object({
    proposals: z.array(zProposal)
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposals ${input}. options: ${options}`);
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
