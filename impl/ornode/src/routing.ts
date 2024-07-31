import { EndpointsFactory, ServeStatic, BuiltinLogger, createResultHandler } from "express-zod-api";
import { z } from "zod";
import { Routing } from "express-zod-api";
import {
  GetTokenOpts,
  zGetProposalsSpec,
  zORNodePropStatus,
  zProposal,
  zProposalFull,
} from "ortypes/ornode.js";
import { zEthAddress, zPropId } from "ortypes";
import { resultHandler } from "./resultHandler.js";
import { getOrnode } from "./ornode.js";
import { stringify } from "ts-utils";
import { join } from "path";
import { zRespectAwardMt, zRespectFungibleMt, zTokenId, TokenId, zFungibleTokenId, zGetTokenOpts } from "ortypes/respect1155.js";
import { Erc1155Mt, zErc1155Mt } from "ortypes/erc1155.js";

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
  output: zProposal,
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
    proposals: z.array(zProposal)
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getProposals ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const proposals = await n.getProposals(input.spec);
    return { proposals };
  }
});

async function handleGetToken(tokenId: TokenId, opts?: GetTokenOpts) {
  const n = await getOrnode();
  const token = await n.getToken(tokenId, opts);
  return token;
}

const getTokenPost = factory.build({
  method: "post",
  input: z.object({
    tokenId: z.union([zFungibleTokenId, zTokenId]),
    opts: zGetTokenOpts.default({ burned: true })
  }),
  output: z.union([zRespectFungibleMt, zRespectAwardMt]),
  handler: async ({ input, options, logger }) => {
    logger.debug(`getToken ${stringify(input)}. options: ${stringify(options)}`);
    return await handleGetToken(input.tokenId, input.opts);
  }
});

const getAward = factory.build({
  method: "post",
  input: z.object({
    tokenId: zTokenId,
    opts: zGetTokenOpts.default({ burned: true })
  }),
  output: zRespectAwardMt,
  handler: async ({input, options, logger}) => {
    logger.debug(`getAward ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const token = await n.getAward(input.tokenId, input.opts);
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
    tokenId: z.union([zFungibleTokenId, zTokenId]),
  }),
  output: z.union([zRespectFungibleMt, zRespectAwardMt]),
  handler: async ({ input, options, logger }) => {
    logger.debug(`token/${input.tokenId}  ${stringify(input)}. options: ${stringify(options)}`);
    return await handleGetToken(input.tokenId, { burned: true });
  }
})

const getAwardsOf = factory.build({
  method: "post",
  input: z.object({
    account: zEthAddress,
    opts: zGetTokenOpts.default({ burned: false })
  }),
  output: z.object({
    awards: zRespectAwardMt.array()
  }),
  handler: async ({input, options, logger}) => {
    logger.debug(`getAwardsOf ${stringify(input)}. options: ${stringify(options)}`);
    const n = await getOrnode();
    const tokens = await n.getAwardsOf(input.account, input.opts);
    return { awards: tokens };
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
    getAwardsOf
  },
  public: new ServeStatic("./public", {
    dotfiles: "deny",
    index: false,
    redirect: false,
  })
};
