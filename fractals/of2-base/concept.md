# Optimism Fractal on Base

This is an interface for [Orec](https://github.com/sim31/ordao/tree/main/contracts/packages/orec) smart contract for Optimism Fractal on Base. It's [respect_contract](https://github.com/sim31/ordao/blob/main/docs/OREC.md#variables) parameter is set to [OPF (season 1-4) distribution](https://optimism.blockscout.com/token/0x53C9E3a44B08E7ECF3E8882996A500eb06c0C5CC?tab=holders) [deployed on Base](https://basescan.org/address/0xe4b4013b6d7de55f86ff24a1406b85a4dfa591ff). Thus it can execute intents of Optimism Fractal just like [Optimism Fractals intents are executed using Orec](https://snapshot.box/#/s:optimismfractal.eth/proposal/0x3c35f474b1e2c037f32455abd75d027aa29d402200ac649fecb8b46c789c26a3) on Optimism.

### Other Orec parameters
1. `voting_period` = 3 days;
2. `veto_period` = 3 days;
3. `max_live_votes` = 6;
4. `prop_weight_threshold` = 256;

### Purpose: Oracle for Eden Fractal Epoch 1 Respect on Base
* Eden Fractal Respect exists on EOS. We are trying to move it to Base; 
* EOS uses different account system, so we need to map EOS accounts of Eden Fractal users to EVM addresses;
* Then we need to mint Respect token on Base;

#### Solution




