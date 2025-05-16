
# ORDAO Fractal

ORDAO fractal is a community dedicated to developing [ORDAO software](https://github.com/sim31/ordao) and supporting communities that use it.

## 1. Respect token

1. Respect is a non-transferable token representing respect (an opinion) that a community has on a particular account;
2. Respect is not a property that can by owned by anyone (or anything) and no participating party owns Respect;

## 2. ORDAO Respect

1. Respect token deployed as the following contract on Optmimism Mainnet is "Parent Respect" of ORDAO Fractal: [0xF6B17Fa1eD95F21E1eAdff6F96ce80E5a562D548](https://optimism.blockscout.com/token/0xF6B17Fa1eD95F21E1eAdff6F96ce80E5a562D548?tab=holders)
2. ORDAO Respect is [Respect1155](https://github.com/sim31/ordao/tree/59b2fcb840048e8a212a04ce51f378404d4c8f6b/contracts/packages/respect1155) contract with an empty distribution at the start of ORDAO fractal;

## 3. Consensus process

1. Consensus process of ORDAO fractal is an implementation of [OREC](https://github.com/sim31/ordao/blob/59b2fcb840048e8a212a04ce51f378404d4c8f6b/docs/OREC.md#specification) with the following parameters:
    1. `voting_period` = 3 days;
    2. `veto_period` = 3 days;
    3. `max_live_votes` = 4;
    4. `prop_weight_threshold` = 62;
    5. `respect_contract` = [Parent Respect](#2-ordao-respect) ([0xF6B17Fa1eD95F21E1eAdff6F96ce80E5a562D548](https://optimism.blockscout.com/token/0xF6B17Fa1eD95F21E1eAdff6F96ce80E5a562D548?tab=holders))
2. Consensus process can distribute [ORDAO Respect](#2-ordao-respect);
3. Consensus process can change how ORDAO fractal works by emitting a [signal event](https://github.com/sim31/ordao/blob/59b2fcb840048e8a212a04ce51f378404d4c8f6b/contracts/packages/orec/contracts/Orec.sol#L90): `Signal(1, <ipfs-link>)`, where `<ipfs-link>` is an ipfs link to a new version of this document;
