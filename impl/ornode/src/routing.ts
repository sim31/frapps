import { EndpointsFactory, ServeStatic, BuiltinLogger, createResultHandler } from "express-zod-api";
import { z } from "zod";
import { Routing } from "express-zod-api";
import {
  zGetProposalsSpec,
  zGetAwardsSpec,
  zORNodePropStatus,
  zStoredProposal,
  zProposalFull,
  zGetVotesSpec,
  zVote,
} from "ortypes/ornode.js";
import { zEthAddress, zPropId } from "ortypes";
import { resultHandler } from "./resultHandler.js";
import { getOrnode } from "./mongoOrnode.js";
import { stringify } from "ts-utils";
import {
  zRespectAwardMt,
  zRespectFungibleMt,
  zTokenId,
  zTokenIdNoPrefix,
  zFungibleTokenIdNoPrefix,
  TokenId,
  zFungibleTokenId,
  zRespectAwardPrettyMt,
  zRespectAwardMtToPretty
} from "ortypes/respect1155.js";
import { Erc1155Mt, zErc1155Mt } from "ortypes/erc1155.js";
import { join } from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const factory = new EndpointsFactory(resultHandler);

const putProposal = factory.build({
  method: "post",
  // All inputs have to be `posts` for some reason
  input: z.object({ proposal: zProposalFull }),
  output: z.object({
    propStatus: zORNodePropStatus
  }),
  handler: async ({ input, options, logger }) => {
    logger.debug(`putProposal ${stringify(input)}. options: ${stringify(options)}`);
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
    logger.debug(`getPeriodNumber ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const periodNum = await n.getPeriodNum();
    return { periodNum };
  },
})

const getProposal = factory.build({
  method: "post",
  input: z.object({ propId: zPropId }),
  output: zStoredProposal,
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposal ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    return await n.getProposal(input.propId);
  }
});

const getProposals = factory.build({
  method: "post",
  input: z.object({ spec: zGetProposalsSpec }),
  output: z.object({
    proposals: z.array(zStoredProposal)
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposals ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const proposals = await n.getProposals(input.spec);
    return { proposals };
  }
});

async function handleGetToken(tokenId: TokenId) {
  const n = await getOrnode();
  const token = await n.getToken(tokenId);
  return token;
}

const getTokenPost = factory.build({
  method: "post",
  input: z.object({
    tokenId: z.union([zFungibleTokenId, zTokenId]),
  }),
  output: z.union([zRespectFungibleMt, zRespectAwardMt]),
  handler: async ({ input, options, logger }) => {
    logger.debug(`getToken ${stringify(input)}. options: ${stringify(options)}`);
    return await handleGetToken(input.tokenId);
  }
});

const getAward = factory.build({
  method: "post",
  input: z.object({
    tokenId: zTokenId
  }),
  output: zRespectAwardMt,
  handler: async ({input, options, logger}) => {
    logger.debug(`getAward ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const token = await n.getAward(input.tokenId);
    return token;
  }
});

const getRespectMetadata = factory.build({
  method: "post",
  input: z.object({}),
  output: zRespectFungibleMt,
  handler: async ({input, options, logger}) => {
    logger.debug(`getRespectMetadata ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const token = await n.getRespectMetadata();
    return token;
  }
});

const getToken = factory.build({
  method: "get",
  input: z.object({
    tokenId: z.union([zFungibleTokenIdNoPrefix, zTokenIdNoPrefix]),
  }),
  output: z.union([zRespectFungibleMt, zRespectAwardPrettyMt, zRespectAwardMt]),
  handler: async ({ input, options, logger }) => {
    logger.debug(`token/${input.tokenId}  ${stringify(input)}. options: ${stringify(options)}`);
    const token = await handleGetToken(input.tokenId);
    if (!('decimals' in token)) {
      return zRespectAwardMtToPretty.parse(token);
    } else {
      return token;
    }
  }
});

const getAwards = factory.build({
  method: "post",
  input: z.object({
    spec: zGetAwardsSpec
  }),
  output: z.object({
    awards: zRespectAwardMt.array()
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getAwards ${stringify(input)}}`);
    const n = await getOrnode();
    const tokens = await n.getAwards(input.spec);
    return { awards: tokens };
  }
});

const getVotes = factory.build({
  method: "post",
  input: z.object({
    spec: zGetVotesSpec
  }),
  output: z.object({
    votes: zVote.array()
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getVotes ${stringify(input)}}`);
    const n = await getOrnode();
    const votes = await n.getVotes(input.spec);
    return { votes };
  }
});

export const routing: Routing = {
  v1: {
    putProposal,
    getProposal,
    getProposals,
    getPeriodNum,
    getToken: getTokenPost,
    getAward,
    getRespectMetadata,
    token: {
      ":tokenId": getToken
    },
    getAwards,
    getVotes
  },
  static: new ServeStatic(join(__dirname, "../static"), {
    dotfiles: "deny",
    index: false,
    redirect: false,
  })
};
