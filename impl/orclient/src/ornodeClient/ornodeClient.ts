type PostV1PutProposalInput = {
    proposal: {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectBreakout";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            groupNum: number;
        } | {
            propType: "respectAccount";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            mintReason: string;
            mintTitle: string;
        } | {
            propType: "burnRespect";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            burnReason: string;
        } | {
            propType: "customSignal";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "tick";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "customCall";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectBreakout";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            groupNum: number;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectAccount";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            mintReason: string;
            mintTitle: string;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "burnRespect";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            burnReason: string;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "customSignal";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "tick";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: string;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "customCall";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    };
};

type PostV1PutProposalResponse = {
    status: "success";
    data: {
        propStatus: "ProposalExists" | "ProposalStored";
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetProposalInput = {
    propId: string;
};

type PostV1GetProposalResponse = {
    status: "success";
    data: {
        id: string;
        content?: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        } | undefined;
        attachment?: ({
            propType: "respectBreakout";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            groupNum: number;
        } | {
            propType: "respectAccount";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            mintReason: string;
            mintTitle: string;
        } | {
            propType: "burnRespect";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            burnReason: string;
        } | {
            propType: "customSignal";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "tick";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "customCall";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
        }) | undefined;
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectBreakout";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            groupNum: number;
        } | {
            propType: "respectAccount";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            mintReason: string;
            mintTitle: string;
        } | {
            propType: "burnRespect";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            burnReason: string;
        } | {
            propType: "customSignal";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "tick";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        } | {
            propType: "customCall";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectBreakout";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            groupNum: number;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "respectAccount";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            mintReason: string;
            mintTitle: string;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "burnRespect";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            burnReason: string;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "customSignal";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "tick";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
            link?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    } | {
        id: string;
        content: {
            addr: any;
            cdata: string | any;
            memo: string | any;
        };
        attachment: {
            propType: "customCall";
            propTitle?: string | undefined;
            propDescription?: string | undefined;
            salt?: string | undefined;
        };
        /** Unix timestamp. Should match onchain createTime of proposal */
        createTs?: number | undefined;
        /** Hash of transaction which created this proposal */
        createTxHash?: string | undefined;
        /** Hash of transaction which executed this proposal */
        executeTxHash?: string | undefined;
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetProposalsInput = {
    spec: {
        before?: number | undefined;
        limit?: number | undefined;
    };
};

type PostV1GetProposalsResponse = {
    status: "success";
    data: {
        proposals: ({
            id: string;
            content?: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            } | undefined;
            attachment?: ({
                propType: "respectBreakout";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                groupNum: number;
            } | {
                propType: "respectAccount";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                mintReason: string;
                mintTitle: string;
            } | {
                propType: "burnRespect";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                burnReason: string;
            } | {
                propType: "customSignal";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            } | {
                propType: "tick";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            } | {
                propType: "customCall";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
            }) | undefined;
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "respectBreakout";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                groupNum: number;
            } | {
                propType: "respectAccount";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                mintReason: string;
                mintTitle: string;
            } | {
                propType: "burnRespect";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                burnReason: string;
            } | {
                propType: "customSignal";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            } | {
                propType: "tick";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            } | {
                propType: "customCall";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "respectBreakout";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                groupNum: number;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "respectAccount";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                mintReason: string;
                mintTitle: string;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "burnRespect";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                burnReason: string;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "customSignal";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "tick";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
                link?: string | undefined;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        } | {
            id: string;
            content: {
                addr: any;
                cdata: string | any;
                memo: string | any;
            };
            attachment: {
                propType: "customCall";
                propTitle?: string | undefined;
                propDescription?: string | undefined;
                salt?: string | undefined;
            };
            /** Unix timestamp. Should match onchain createTime of proposal */
            createTs?: number | undefined;
            /** Hash of transaction which created this proposal */
            createTxHash?: string | undefined;
            /** Hash of transaction which executed this proposal */
            executeTxHash?: string | undefined;
        })[];
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type GetV1GetPeriodNumInput = {};

type GetV1GetPeriodNumResponse = {
    status: "success";
    data: {
        periodNum: number;
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetTokenInput = {
    tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000" | string;
};

type PostV1GetTokenResponse = {
    status: "success";
    data: {
        name?: string | undefined;
        decimals: 0;
        description?: string | undefined;
        image?: string | undefined;
        properties?: {} | undefined;
    } | {
        name: string;
        description?: string | undefined;
        image?: string | undefined;
        properties: {
            tokenId: string;
            recipient: any;
            mintType: number;
            mintTs?: number | undefined;
            mintTxHash?: string | undefined;
            denomination: number;
            periodNumber: number;
            groupNum?: number | undefined;
            level?: number | undefined;
            reason?: string | undefined;
            title?: string | undefined;
            burn?: ({
                burnTxHash?: string | undefined;
                burnReason?: string | undefined;
            } | null) | undefined;
            mintProposalId?: string | undefined;
        };
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetAwardInput = {
    tokenId: string;
};

type PostV1GetAwardResponse = {
    status: "success";
    data: {
        name: string;
        description?: string | undefined;
        image?: string | undefined;
        properties: {
            tokenId: string;
            recipient: any;
            mintType: number;
            mintTs?: number | undefined;
            mintTxHash?: string | undefined;
            denomination: number;
            periodNumber: number;
            groupNum?: number | undefined;
            level?: number | undefined;
            reason?: string | undefined;
            title?: string | undefined;
            burn?: ({
                burnTxHash?: string | undefined;
                burnReason?: string | undefined;
            } | null) | undefined;
            mintProposalId?: string | undefined;
        };
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetRespectMetadataInput = {};

type PostV1GetRespectMetadataResponse = {
    status: "success";
    data: {
        name?: string | undefined;
        decimals: 0;
        description?: string | undefined;
        image?: string | undefined;
        properties?: {} | undefined;
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type GetV1TokenTokenIdInput = {
    tokenId: "0x0000000000000000000000000000000000000000000000000000000000000000" | string;
};

type GetV1TokenTokenIdResponse = {
    status: "success";
    data: {
        name?: string | undefined;
        decimals: 0;
        description?: string | undefined;
        image?: string | undefined;
        properties?: {} | undefined;
    } | {
        name: string;
        description?: string | undefined;
        image?: string | undefined;
        properties: {
            tokenId: string;
            recipient: any;
            mintType: number;
            mintTxHash?: string | undefined;
            denomination: number;
            periodNumber: number;
            groupNum?: number | undefined;
            level?: number | undefined;
            reason?: string | undefined;
            title?: string | undefined;
            burn?: ({
                burnTxHash?: string | undefined;
                burnReason?: string | undefined;
            } | null) | undefined;
            mintProposalId?: string | undefined;
            mintDateTime?: string | undefined;
        };
    } | {
        name: string;
        description?: string | undefined;
        image?: string | undefined;
        properties: {
            tokenId: string;
            recipient: any;
            mintType: number;
            mintTs?: number | undefined;
            mintTxHash?: string | undefined;
            denomination: number;
            periodNumber: number;
            groupNum?: number | undefined;
            level?: number | undefined;
            reason?: string | undefined;
            title?: string | undefined;
            burn?: ({
                burnTxHash?: string | undefined;
                burnReason?: string | undefined;
            } | null) | undefined;
            mintProposalId?: string | undefined;
        };
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetAwardsInput = {
    spec: {
        before?: number | undefined;
        limit?: number | undefined;
        recipient?: string | undefined;
        burned?: boolean | undefined;
    };
};

type PostV1GetAwardsResponse = {
    status: "success";
    data: {
        awards: {
            name: string;
            description?: string | undefined;
            image?: string | undefined;
            properties: {
                tokenId: string;
                recipient: any;
                mintType: number;
                mintTs?: number | undefined;
                mintTxHash?: string | undefined;
                denomination: number;
                periodNumber: number;
                groupNum?: number | undefined;
                level?: number | undefined;
                reason?: string | undefined;
                title?: string | undefined;
                burn?: ({
                    burnTxHash?: string | undefined;
                    burnReason?: string | undefined;
                } | null) | undefined;
                mintProposalId?: string | undefined;
            };
        }[];
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

type PostV1GetVotesInput = {
    spec: {
        before?: number | undefined;
        limit?: number | undefined;
        propFilter?: string[] | undefined;
        voterFilter?: string[] | undefined;
        minWeight?: number | undefined;
        voteType?: ("None" | "Yes" | "No") | undefined;
    };
};

type PostV1GetVotesResponse = {
    status: "success";
    data: {
        votes: {
            ts?: number | undefined;
            txHash?: string | undefined;
            proposalId: string;
            voter: any;
            weight: number;
            vote: "None" | "Yes" | "No";
            memo?: string | undefined;
        }[];
    };
} | {
    status: "error";
    error: {
        message: string;
        name?: string;
    };
};

export type Path = "/v1/putProposal" | "/v1/getProposal" | "/v1/getProposals" | "/v1/getPeriodNum" | "/v1/getToken" | "/v1/getAward" | "/v1/getRespectMetadata" | "/v1/token/:tokenId" | "/v1/getAwards" | "/v1/getVotes";

export type Method = "get" | "post" | "put" | "delete" | "patch";

export type MethodPath = `${Method} ${Path}`;

export interface Input extends Record<MethodPath, any> {
    "post /v1/putProposal": PostV1PutProposalInput;
    "post /v1/getProposal": PostV1GetProposalInput;
    "post /v1/getProposals": PostV1GetProposalsInput;
    "get /v1/getPeriodNum": GetV1GetPeriodNumInput;
    "post /v1/getToken": PostV1GetTokenInput;
    "post /v1/getAward": PostV1GetAwardInput;
    "post /v1/getRespectMetadata": PostV1GetRespectMetadataInput;
    "get /v1/token/:tokenId": GetV1TokenTokenIdInput;
    "post /v1/getAwards": PostV1GetAwardsInput;
    "post /v1/getVotes": PostV1GetVotesInput;
}

export interface Response extends Record<MethodPath, any> {
    "post /v1/putProposal": PostV1PutProposalResponse;
    "post /v1/getProposal": PostV1GetProposalResponse;
    "post /v1/getProposals": PostV1GetProposalsResponse;
    "get /v1/getPeriodNum": GetV1GetPeriodNumResponse;
    "post /v1/getToken": PostV1GetTokenResponse;
    "post /v1/getAward": PostV1GetAwardResponse;
    "post /v1/getRespectMetadata": PostV1GetRespectMetadataResponse;
    "get /v1/token/:tokenId": GetV1TokenTokenIdResponse;
    "post /v1/getAwards": PostV1GetAwardsResponse;
    "post /v1/getVotes": PostV1GetVotesResponse;
}

export const jsonEndpoints = { "post /v1/putProposal": true, "post /v1/getProposal": true, "post /v1/getProposals": true, "get /v1/getPeriodNum": true, "post /v1/getToken": true, "post /v1/getAward": true, "post /v1/getRespectMetadata": true, "get /v1/token/:tokenId": true, "post /v1/getAwards": true, "post /v1/getVotes": true };

export const endpointTags = { "post /v1/putProposal": [], "post /v1/getProposal": [], "post /v1/getProposals": [], "get /v1/getPeriodNum": [], "post /v1/getToken": [], "post /v1/getAward": [], "post /v1/getRespectMetadata": [], "get /v1/token/:tokenId": [], "post /v1/getAwards": [], "post /v1/getVotes": [] };

export type Provider = <M extends Method, P extends Path>(method: M, path: P, params: Input[`${M} ${P}`]) => Promise<Response[`${M} ${P}`]>;

export type Implementation = (method: Method, path: string, params: Record<string, any>) => Promise<any>;

export class ExpressZodAPIClient {
    constructor(protected readonly implementation: Implementation) { }
    public readonly provide: Provider = async (method, path, params) => this.implementation(method, Object.keys(params).reduce((acc, key) => acc.replace(`:${key}`, params[key]), path), Object.keys(params).reduce((acc, key) => path.indexOf(`:${key}`) >= 0 ? acc : { ...acc, [key]: params[key] }, {}));
}

// Usage example:
/*
export const exampleImplementation: Implementation = async (method, path, params) => { const hasBody = !["get", "delete"].includes(method); const searchParams = hasBody ? "" : `?${new URLSearchParams(params)}`; const response = await fetch(`https://example.com${path}${searchParams}`, { method: method.toUpperCase(), headers: hasBody ? { "Content-Type": "application/json" } : undefined, body: hasBody ? JSON.stringify(params) : undefined }); if (`${method} ${path}` in jsonEndpoints) {
    return response.json();
} return response.text(); };
const client = new ExpressZodAPIClient(exampleImplementation);
client.provide("get", "/v1/user/retrieve", { id: "10" });*/ 