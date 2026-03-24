# ORDAO History

[ORDAO](../apps/orfrapps/ordao/) is a toolset. As with any tool there are different ways of using it and some ways might work better than others. Additionally context matters - a tool might work better in some contexts than in others. Furthermore a tool might be better suited for solving certain sets of problems than others.

The purpose of this document is to shine a light on ORDAO usage / development patterns that work by providing a clear history of how ORDAO developed and how it has successfully been used so far. Hopefully this will provide useful context for future developments or ORDAO or alternative codebases.

## ORDAO origins

ORDAO was initially created to solve specific problems for one specific community - [Optimism Fractal](./optimism-fractal/). Optimism Fractal was created by participants of [Eden Fractal Epoch 1](./eden-fractal-1/) by replicating their current which worked on EOS blockchain, to Optimism and presenting it to Optimism community. ORDAO was meant to solve problems a lot of which Optimism Fractal inherited from Eden Fractal Epoch 1. Hence we have to start with Eden Fractal Epoch 1.

### ORDAO grandparent - Eden Fractal Epoch 1 toolset

The relevant part of Eden Fractal Epoch 1 for us here is the process through which in-meeting [respect game](../concepts/respect-game.md) results were submitted onchain and produced an onchain [respect](../concepts/respect.md) distribution. Three components were at play here

* [Fractalgram](./eden-fractal-1/index.md#fractalgram-from-meeting-35) - an app where people played [respect game](../concepts/respect-game.md) ([fractalgram mode](../concepts/fractalgram.md));
* [Submission frontend](./eden-fractal-1/index.md#consensus-submissions-frontend) - an app through which people submitted respect game results to the smart contracts;
* [EOS Smart contract](./eden-fractal-1/index.md#smart-contracts) which collected respect game results and implemented respect token;

**The respect game submissions did not automatically produce a respect distribution.** The Respect distribution was controled by a multisignature setup consisting of members of the community. Every mint of Respect had to be confirmed by this multisig. The respect game result submissions served only as a signal based on which an msig proposal was created and later executed.

So overall process went like this:
1. Community plays respect game in meeting using [fractalgram](./eden-fractal-1/index.md#fractalgram-from-meeting-35)
2. At the end of the game fractalgram generates a link to the submission frontend in which respect game results (from a single breakout room) are encoded (e.g.: `https://edenfracfront.web.app/?delegate=tadas25&groupnumber=1&vote1=tadas25&vote2=dan&vote3=rosmari&vote4=vlad`);
3. Participants of a breakout room go to that link, click a submit button, which initiates a transaction which records their submission of the results (the user effectively signs respect game results from his breakout room and the signature is recorded onchain);
4. Someone [^1] checks all the submissions from the respect game event and creates an msig proposal to distribute Respect accordingly ([using fibonnaci starting with 5](./eden-fractal-1/meeting-str-1-18.md)).
5. Participants of the msig review and confirm an msig proposal;
6. MSIG proposal is executed;

There were obvious flaws with this approach. Primarily that manual effort was needed to distribute respect and collect signatures. That sometimes lead to late distributions and in the end to [failures to distribute](https://www.notion.so/edencreators/Respect-Distribution-Considerations-for-Epoch-2-1fb074f5adac80a8aceccfa41773804d?source=copy_link#1ff074f5adac80f8bad1ef4cc89b1105). But it worked for most of epoch 1 and most importantly it was transparrent process (there's an onchain record of all respect submissions and the whole respect distribution can be checked against that). It also had an added benefit of flexibility when it came to implementing the intent of respect game session - in case of failures by participants to submit or in case of conflicting submissions, we were able to figure out the true intent of participants after the meeting and create the appropriate msig proposals. This would not have been possible with any kind of completely automated respect distribution system.


### ORDAO parent - Optimsim Fractal 1st generation toolset

In summer of 2023 group of 4 Eden Fractal participants (team known as [Optimystics](https://optimystics.io/)) started collaborating to bring Respect Games to Optimism. One of the motivations was potential synergy between respect game and [RetroPGF](https://retropgfhub.com/) as both of them are retroactive in nature [^2]. This culminated in the beginning of Optimism Fractal in October of 2023 ([around 72nd event of Eden Fractal](https://www.youtube.com/watch?v=ZFoAoZgwx3g&list=PLa5URJF9l5lkX4t8YMZ7wytDZggdXeFor&index=68)).

Partly because of the time constraints, partly because of lack of agreement within Optimystics about the design of the next version of a fractal app, the initial version of Optimism Fractal was in a lot of ways a replica of Eden Fractal, just on Optimism. Same [fractalgram](./eden-fractal-1/index.md#fractalgram-from-meeting-35) app was used for playing Respect Game. The [submission frontend](../history/optimism-fractal/index.md#tools--frontends) (for submitting respect game results) was a fork of the [Eden Fractal submission frontend](../history/eden-fractal-1/index.md#consensus-submissions-frontend). The main change was the [smart contract](https://github.com/Optimystics/op-fractal-sc/tree/0ab15a1c2e3a242289b16bcce25acfb721e33c26) since it had to be an EVM smart contract to work on Optimism (Eden Fractal worked on EOS). But even the smart contract in a lot of ways mirrored the design of the smart contract on EOS in order to be compatible with other components (submission frontend and fractalgram). It had an [owner](https://docs.openzeppelin.com/contracts/4.x/access-control#ownership-and-ownable), which was 3/4 msig setup consisting of 4 members of Optimystics. The owner could mint and burn Respect as needed.

There was one key change though - executor role. The owner could set an "executor" account, which had a permission to distribute respect once a week, by submitting respect game results. The owner could obviously change the "executor" at any time and basically overide executors actions by burning and re-minting respect. Thus, during normal operation, when executor simply implements the will of community and community agrees with him, we were able to distribute Respect with much less hassle than in Eden Fractal epoch 1, while still having a fallback mechanism controlled by the msig in case something went wrong.

Overall it could be said that the 1st generation of Optimism Fractal software was significant in that it brought respect game to Optimism and to EVM world in general. But it was only a small step forward when it came the actual process:
* The executor still had to distribute Respect manually;
* The owner of the smart contract and effectively the whole onchain respect distribution were 4 people who founded Optimism Fractal. The rest of community did not have any onchain control yet;

We understood these key issues when deploying Optimism Fractal and hence looked the initial version as a prototype which we could use to bootstrapping future improvements. We also wanted community to have a clear picture on how Optimism Fractal has potential to work without being distracted by the limitations of the current software. Therefore we introduced something we called "intent document" - a short [document that explains how Optimism Fractal was intended to work natural (not too technical) language](../history/optimism-fractal/of-intent-1.pdf). [It](../history/optimism-fractal/of-intent-1.pdf) covered what Optimism Fractal is, what is Respect, what is Respect game and most importantly defined a mapping between respect game results (contributor rankings from each breakout group) and Respect distribution (amount of Respect given to each ranked contributor). This way we were communicating clearly how respect game submissions were supposed to be translated to Respect distribution. Thus even though the actual onchain mechanism used was not fully decentralized and democratized yet, because it depended on an executor and msig of 4 people, it was (and still is) transparent and verifiable - using onchain history you can check if respect was distribued according to democratic and credibly neutral mechanism described in the intent document.

This original intent document also defined a simple, council-based, consensus process for making changes to any of the rules of Optimism Fractal or its Respect distribution. It then defined a "bootstrap stage" as first 12 events during which the "council" which makes decision in consensus process would be the 4 people who have founded Optimism Fractal. This meant that, in the beginning, consensus process of Optimism Fractal defined in the intent document and the msig setup which controlled the onchain smart contracts matched each other. The onchain msig implemented the consensus process defined in the intent document.

The bootstrap stage made a lot of sense - we wanted consensus process to be based on Respect distribution (one of the main use cases of Respect - bootstrapping governance), but we did not have any respect distribution to start with. So some kind of bootstrapping phase to build up the initial distribution was needed.

But this bootstrap stage had a predefined limit. The one which seemed reasonable to us at the time. We expected to implement a fully onchain legitimate consensus process that would give all the power to the respect-holders who have been participating throughout the bootstrap stage and beyond.




[^1]: Dan Singjoy

[^2]: https://optimystics.io/enhancing-retropgf-with-optimism-fractal