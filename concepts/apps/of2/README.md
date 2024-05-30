# Optimism Fractal 2

This tracks work being done in this repo to upgrade Optimism Fractal software.

## Concept (intent)

[OF2-CONCEPT document here](./OF2-CONCEPT.md) describes how the proposed version would work. It is a modified version of the [current intent document](../of1/OP_Fractal_Intent_V2.pdf) that Optimism Fractal participants should be familiar with. It serves the same function as the current intent document. It is a human language definition of Optimism Fractal that could be useful to prevent any misunderstandings and contentious forks.

[Read full concept here](./OF2-CONCEPT.md).

## Implementation (work in progress)

Work is being done to implement this concept [here](../../../impl).

Smart contracts needed to implement [concept](#concept-intent) are done. It consist of [Orec](../../../impl/orec/sc/) and [Respect1155](../../../impl/respect/sc/).

[Respect1155](../../../impl/respect/sc/) fixes [main headaches](https://www.notion.so/edencreators/Improve-representation-of-Respect-on-block-explorers-1201d818ff3a430fa662e4d5e398fb79) with the current Respect contract of Optimism Fractal. It is ERC1155 contract with a fungible token representing fungible Respect and NTTs with value attribute that sums to balance of a fungible token.

Other componenets currently being worked on:
* [OrNode](../../../impl/ornode/) - nodejs component that stores OREC proposal metadata; 
* [OrClient](../../../impl/orclient) - client to interact with smart contracts and OrNode;
* [Frontend](../../../impl/orec/gui/)

## Main features

* Ownership transferred to the current respect-holders;
* No need for manual distribution of Respect;
* No need for hard rules about how many submissions from the breakout room is needed. It's up to Respect-holders using [OREC](../../OREC.md);
* Fixes [current problems](https://www.notion.so/edencreators/Improve-representation-of-Respect-on-block-explorers-1201d818ff3a430fa662e4d5e398fb79) with Respect token;
* Enables respect-holders (under limitations of OREC) to mint or burn Respect for reasons other than respect game;
  * This will make it easier to deal with situations where ETH address of a person changes;
  * Allows fixing mistakes in distribution more easily;
  * Also allows awarding Respect for use cases other than Respect Game;
* Easier to deal with cases where breakout room submissions need to be corrected;
* [Other advantages of OREC](../../OREC.md#rationale);

## How will Respect game result in Respect distribution
Frontend will accept breakout room results as always, but then it will translate it to OREC proposal to distribute Respect for break-out room participants (according to their ranking). When the user submits, he will actually be submitting a vote on that OREC proposal. This way an old and familiar Respect game workflow will integrate seamlesly with the new and more powerful OREC mechanism.

## Upgrade path

The idea is to deploy implementation on Optimism mainnet as a test version that can potentially become the new "official" version of Optimism Fractal, if Optimism Fractal consensus decides so. 

[More details here](./UPGRADE_PATH.md).

<!-- TODO: ask for feedback -->
