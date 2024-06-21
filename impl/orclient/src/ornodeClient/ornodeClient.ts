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
    };
} | {
    status: "error";
    error: {
        message: string;
    };
};

type PostV1GetProposalsInput = {
    from: number;
    limit: number;
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
        })[];
    };
} | {
    status: "error";
    error: {
        message: string;
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
    };
};

export type Path = "/v1/putProposal" | "/v1/getProposal" | "/v1/getProposals" | "/v1/getPeriodNum";

export type Method = "get" | "post" | "put" | "delete" | "patch";

export type MethodPath = `${Method} ${Path}`;

export interface Input extends Record<MethodPath, any> {
    "post /v1/putProposal": PostV1PutProposalInput;
    "post /v1/getProposal": PostV1GetProposalInput;
    "post /v1/getProposals": PostV1GetProposalsInput;
    "get /v1/getPeriodNum": GetV1GetPeriodNumInput;
}

export interface Response extends Record<MethodPath, any> {
    "post /v1/putProposal": PostV1PutProposalResponse;
    "post /v1/getProposal": PostV1GetProposalResponse;
    "post /v1/getProposals": PostV1GetProposalsResponse;
    "get /v1/getPeriodNum": GetV1GetPeriodNumResponse;
}

export const jsonEndpoints = { "post /v1/putProposal": true, "post /v1/getProposal": true, "post /v1/getProposals": true, "get /v1/getPeriodNum": true };

export const endpointTags = { "post /v1/putProposal": [], "post /v1/getProposal": [], "post /v1/getProposals": [], "get /v1/getPeriodNum": [] };

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