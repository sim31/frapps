import { ORNodeMemImpl } from "orclient";
import { EthZeroAddress } from "ortypes";

export const ornode = ORNodeMemImpl.ORNodeMemImpl.createORNodeMemImpl({
  newRespect: EthZeroAddress,
  orec: EthZeroAddress
});

ornode.then(v => console.log("ok", v), reason => console.log("rejected: ", reason));