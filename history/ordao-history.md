# ORDAO History

[ORDAO](../apps/orfrapps/ordao/) is a toolset. As with any other set of tools there are different ways of using it and some ways might work better than others. Additionally context matters - a tool might work better in some contexts than in others. Furthermore a tool might be more suited for solving certain sets of problems than others.

The purpose of this document is to shine a light on ORDAO usage / development patterns that work by providing a clear history of how ORDAO developed and how it has successfully been used so far. Hopefully this will provide useful context for future developments or ORDAO or alternative codebases.

## ORDAO origins

ORDAO was initially created to solve specific problems for one specific community - [Optimism Fractal](./optimism-fractal/). Optimism Fractal was created by participants of [Eden Fractal Epoch 1](./eden-fractal-1/) by replicating Eden Fractal process, which worked on EOS blockchain, on Optimism and presenting it to Optimism community. ORDAO was meant to solve problems that Optimism Fractal inherited from Eden Fractal Epoch 1. Hence we have to start with Eden Fractal Epoch 1.

### ORDAO grandparent - Eden Fractal Epoch 1 toolset

The relevant part of Eden Fractal Epoch 1 for us here is the process through which in-meeting [respect game](../concepts/respect-game.md) results were submitted onchain and produced an onchain [respect](../concepts/respect.md) distribution. Three components were at play here

* [Fractalgram](./eden-fractal-1/index.md#fractalgram-from-meeting-35) - an app where people played [respect game](../concepts/respect-game.md) ([fractalgram mode](../concepts/fractalgram.md));
* [Submission frontend](./eden-fractal-1/index.md#consensus-submissions-frontend) - an app through which people submitted respect game results to the smart contracts;
* [EOS Smart contract](./eden-fractal-1/index.md#smart-contracts) which collected respect game results and and implemented respect token;

**The respect game submissions did not automatically produce a respect distribution.** The Respect distribution was controled by a multisignature setup consisting of members of the community. Every mint of Respect had to be confirmed by this multisig. The respect game result submissions served only as a signal based on which an msig proposal was created an later executed.

So overall process went like this:
1. Play respect game in meeting using [fractalgram](./eden-fractal-1/index.md#fractalgram-from-meeting-35)
2. At the end of the game fractalgram generates a link to the submission frontend in which respect game results (from a single breakout room) are encoded (e.g.: https://edenfracfront.web.app/?delegate=tadas25&groupnumber=1&vote1=tadas25&vote2=dan&vote3=rosmari&vote4=vlad);
3. Participants of a breakout room go to that link, click a submit button, which initiates a transaction which records their submission of the results (the user effectively signs respect game results from his breakout room and the signature is recorded onchain);
4. Someone [^1] checks all the submissions from the respect game event and creates an msig proposal to distribute Respect accordingly ([using fibonnaci starting with 5](./eden-fractal-1/meeting-str-1-18.md)).
5. Participants of the msig review and confirm an msig proposal;
6. MSIG proposal is executed;


### ORDAO parent - Optimsim Fractal 1st generation


[^1]: Dan Singjoy