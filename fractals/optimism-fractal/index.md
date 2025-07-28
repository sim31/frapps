<!-- omit in toc -->
# Optimism Fractal

- [Intent document](#intent-document)
- [Meeting structure](#meeting-structure)
- [Consensus process](#consensus-process)
- [Smart contracts](#smart-contracts)
- [Respect token](#respect-token)
- [Executive process](#executive-process)
  - [Meetings 1 - 48](#meetings-1---48)
  - [From meeting 49](#from-meeting-49)
- [Tools / frontends](#tools--frontends)
- [Optimism Town Hall](#optimism-town-hall)
- [Other resources](#other-resources)
- [Footnotes](#footnotes)

## Intent document
Intent document describes how Optimism Fractal works in natural language (meeting structure, rules for consensus process, executive process, respect game, etc).

* [Meetings 1 - 12](./of-intent-1.pdf)
* [Meetings 13 - 30](./of-intent-2.pdf)
* [Meetings 30 - 48](./of-intent-3.pdf)
* [Meetings 48 - 54](./of-intent-4.md)
* [Meetings 54 - ](./of-intent-5.md)

[Changelog](./intent-changelog.md)

## Meeting structure
Sections 1 and 2 of [intent document](./of-intent-1.pdf).

## Consensus process
* **Meetings 1 - 12:** section 6, 7 [intent document 1](./of-intent-1.pdf)
* **Meeting 13 -:** section 6 in [intent document 2](./of-intent-2.pdf)
  * [Proposals in snapshot](https://snapshot.box/#/s:optimismfractal.eth)

## Smart contracts
* [Meetings 1 - 48](../../apps/op-fractal/contracts/)
* [Meeting 49 -](../../apps/ordao/contracts/packages/)

## Respect token
* [Meetings 1 - 48](../../apps/op-fractal/contracts/) (part of main onchain contract);
* [Meetings 49 -](../../apps/ordao/contracts/packages/respect1155/)

## Executive process
Executive process is used to execute the will of [consensus process](#consensus-process) and distribute respect according to respect game result submissions [^1].

### Meetings 1 - 48
Multisignature account as the owner of [smart contract](#smart-contracts), plus executor function in contract which allows owner to delegate an account to perform respect distributions.

### Meeting 49 -
Optimistic Respect-based executive contract ([OREC](../../concepts/orec.md)).

* [Documentation](../../apps/ordao/docs/OREC.md)
* [Implementation](../../apps/ordao/contracts/packages/orec/)

## Tools / frontends
* Fractalgram - used to play Respect game
  * [Old telegram-based](../../apps/fractalgram-tg/)
  * [New, standalone respect-game app](https://respect-game.vercel.app/)
* ORDAO frontend (available from around meeting 60)
  * [Codebase](../../apps/ordao/apps/gui/)
  * URL of deployment: https://of.frapps.xyz or https://optimism.frapps.xyz
* [Snapshot](https://snapshot.box/#/s:optimismfractal.eth) - polling app used by [consensus process](#consensus-process)

## Optimism Town Hall
Optimism Town Hall is a collaborative forum for discussions about Ethereum and the Superchain, with a special focus on community coordination and governance.

This is where a lot of Optimism Fractal related topics are discussed by playing [cagendas](../../concepts/cagendas.md).

* [Homepage](https://optimismtownhall.com/)
* [Snapshot space for scheduling specific topics in advance before each event](https://snapshot.box/#/s:optimismtownhall.eth)
* [Snapshot space for organizing ongoing list of topics](https://snapshot.box/#/s:optopics.eth)
* [Playlist of event recordings](https://www.youtube.com/watch?v=K-_KsBH06EU&list=PLa5URJF9l5lnKMD_3hfte2XFp7K1nKuVq)

## Other resources
* [Homepage](https://optimismfractal.com)
* [Playlist of meeting recordings](https://www.youtube.com/watch?v=6Lc2W0wW37Y&list=PLa5URJF9l5lk5Aavi98CqFj7ryM42bvbP)
* [Discord server](https://discord.gg/BtSNDRVQGJ)

## Footnotes
[^1]: ["Executive contract" in intent document](./of-intent-5.md#7-executive-contract)