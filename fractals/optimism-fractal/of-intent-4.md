# Optimism Fractal Concept

**Optimism Fractal is a community dedicated to fostering collaboration, awarding public good creators, and optimizing governance on the Optimism Superchain**

### 1. Respect Game meetings

1. [Respect Game](#2-respect-game) meetings happen weekly;
2. At the start of the meeting participants are randomly distributed into break-out groups of 3 to 6 people. Each break-out group plays [Respect game](#2-respect-game), which lasts for 45 minutes;

### 2. Respect Game

1. Each participant of the group is given up to 4 minutes to present their contributions. Their presentation should answer the following question: "What did I do this week to help Optimism?"
2. After everyone has had time to present, the group tries to reach consensus on rankings of contributions;
  1. The participant who has contributed the most gets Level 6, the second biggest contributor gets level 5 and so on;

### 3. Respect

1. Respect is a non-transferable token representing respect (an opinion) that a community (in this case Optimism Fractal) has on a particular account;
2. Respect is not a property that can by owned by anyone (or anything) and no participating party owns Respect;

### 4. Respect Distribution

1. Respect should be distributed to participants of each break-out group which was able to reach consensus:
   1. Level 6 receives 55 Respect;
   2. Level 5 receives 34 Respect;
   3. Level 4 receives 21 Respect;
   4. Level 3 receives 13 Respect;
   5. Level 2 receives 8 Respect;
   6. Level 1 receives 5 Respect;

### 5. Consensus process

1. Every week, during Respect Game meeting, a poll is created for participants to register to take part in the consensus process of Optimism Fractal next week. This is “registration poll”. Participants can register throughout the whole week;
2. Top 6 [Parent Respect](#5-parent-respect-token) earners out of those who registered in last week’s “registration poll” constitute a "council" for the current week;
3. A new council is activated at the start of a Respect Game meeting. Respect distribution at that moment is used to determine the council;
4. If fewer than 6 participants have registered, then council is smaller (consists only of those who registered);
5. A proposal is said to be passed by Optimism Fractal if at least 2/3rds of council members signal approval for it;
6. Proposals passed by the council can:
   1. Signal opinion of Optimism Fractal community;
   2. Make changes to the rules of Optimism Fractal (i.e.: rules expressed here);
   3. Select software implementation of Optimism Fractal (i.e.: implementation of rules defined here - smart contract deployment, official frontends, etc);
   4. Blacklist break-out group results;
   5. Make changes to the current Respect distribution (burn existing or mint additional Respect);
7. Optimism Fractal does not have any control or any other kind of power over any participating parties;

### 5. Parent Respect token

1. Respect token deployed as the following contract on Optmimism Mainnet is "Parent Respect" of Optimism Fractal:
  [0x53C9E3a44B08E7ECF3E8882996A500eb06c0C5CC](https://optimistic.etherscan.io/address/0x53c9e3a44b08e7ecf3e8882996a500eb06c0c5cc);

### 6. Executive contract

1. Executive contract is an onchain smart contract selected by [consensus process](#5-consensus-process) to execute onchain actions necessary to [distribute Respect](#4-respect-distribution) and implement the will expressed by the [consensus process](#5-consensus-process).
2. Executive contract can be changed by the [consensus process](#5-consensus-process) at any time;


<!-- 1. Onchain Respect distribution of Optimism Fractal is managed by [Optimistic Respect-based executive contract](../../OREC.md#specification), configured with the following parameters:
   1. `voting_period` = 2 day;
   2. `veto_period` = 2 days;
   3. `prop_weight_threshold` = 408;
   4. `respect_contract` = [Parent Respect contract](#5-parent-respect-token);
   5. `max_live_votes` = 4; -->


