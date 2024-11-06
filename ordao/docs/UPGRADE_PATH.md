# Ugrade Path for Optimism Fractal contracts

The following is a description of a potential path to transition to an implementation of [Optimism Fractal 2 concept](./OF2-CONCEPT.md).

1. Deploy app that implements the [Optimism Fractal 2 concept](./OF2-CONCEPT.md). Call it a candidate version.
2. Participants can test candidate version by submitting breakout results to it (alongside submissions to the current (old) app).
3. After some period of time (I recommend around 6 weeks if no critical bugs are found), if participants are satisfied with the new version and feel like it is tested enough they can pass a proposal (using their current consensus process) to make candidate version the new "official" app of Optimism Fractal.
4. From then on participants start submitting solely through this new app.

The new version will have a new Respect token at a different onchain address. This new Respect distribution will have overlap with the old distribution for the time of testing, but other than that it will be a new distribution. 

So let's say this upgrade path is implemented and by season 4 we start using the new version. Then if you want to see who earned how much Respect during seasons 1-3 you will check the old address and if you want to see Respect balances for later seasons you will check the new address. The second half of season 3 would be transition time which would have Respect earned during that time reflected in both old as well as new token contract.

## Renewal of Respect distribution
In the past we talked about the need for consensus process to take into account when the Respect was earned in order to prevent participants who earned a lot in the past, from wielding too much power. This upgrade mechanism would naturally solve this without adding any onchain overhead. This differentiation of old vs new Respect earnings can be useful for external uses of Respect distribution, like retroactive funding (e.g.: to differentiate what's has been rewarded already).

## Bootstraping on the old Respect distribution
As you can see from [Optimism Fractal 2 concept](./OF2-CONCEPT.md) proposed here, the old Respect distribution would be used to manage onchain Respect distribution of a new version. This repeats the pattern that Optimism Fractal is already familiar with. The current Respect distribution is currently managed by msig of 4 people also known as Optimystics. This team of 4 people met and started respecting each other in EdenFractal. So you have old Respect-relationships creating and taking care of onchain aspect of new fractal deployments.

### Why not have the new version manage itself using the Respect distribution it itself produces? 

First of all, any new distribution would not be comparable to the old one in terms of security. More than 24 weeks of respect games are worth something. It also means something that there have been no disputes about this distribution being wrong. It also means something that there have been no serious bugs found in the smart contract. Neither the new smart contract nor the Respect distribution it produces can have any of these features.

I would argue this is an overall superior way for DAO to manage itself, when compared to models where same DAO contract is also its top authority. A contract cannot protect itself from itself (its bugs and loopholes). But what you can do is use the well-tested old and reliable version of a DAO as a safeguard in case of issues in the new version.

## Precedent for regenerative fractal
Being regenerative is about being able to efficiently loose the old parts of itself and replace them new.

Normally as an onchain DAO gets older it gets harder and harder to innovate because you're constrained by your past designs and old power structures. This upgrade path avoids this problem. It also respects the old (parent) version and uses it for security, which helps make a transition smoother.

But it is not just about being free from past designs, it's also about freedom from long-term concerns. If we have an upgrade path like this available as an option, we can adopt a "good enough" app for next couple of seasons, without worrying that it might not be fully aligned with our future vision. End result is that we can move in the present faster.

Overall this could set a precedent for a fractal that is able to periodically recreate itself and adapt.

## Going forward / scope of this proposal
My intended scope of [Optimism Fractal 2](./OF2-CONCEPT.md) is 2-3 seasons (ideally starting with season 5). After that we might come up with something better and we might use an anologous upgrade path to do the transition.

## *UPDATE*
Optimism Fractal passed [a proposal](https://snapshot.org/#/optimismfractal.eth/proposal/0x3c35f474b1e2c037f32455abd75d027aa29d402200ac649fecb8b46c789c26a3) to adopt ORDAO this season. The upgrade path ended up being a bit different. Namely in that it happened for season 5 as opposed to season 4 and there's no overlap between the new and old token distribution so far. See [this thread](https://discord.com/channels/1164572177115398184/1164572177878765591/1298633304383426621) for more details.

The cause for using a totally fresh token distribution is that a new version of ORDAO contracts needs to be redeployed anyway, and there hasn't been a clear consensus signal from Optimism Fractal regarding whether it wants new distribution to incorporate the old and to what extent.


