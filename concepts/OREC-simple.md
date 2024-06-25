# Optimistic Respect-based Executive Contract

**Optimistic Respect-based Executive Contract (OREC)** is a smart contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here). The main use case is performing code updates of a DAO (if OREC is set as an owner of a proxy contract) but it can be used for other transactions as well.

It is optimistic because it trusts a minority of contributors who take the initiative to act on behalf of a DAO even if they hold a small amount of Respect. The security comes from a time delay during which other contributors can easily block a transaction if they collectively have a significant enough amount of Respect relative to what the initiators have.

## Definitions

- *Proposal* - proposal to execute some transaction. Once proposal is passed this transaction can be executed;

## Variables

- `voting_period` - first stage of proposal. Anyone can vote either `YES` or `NO` here;
- `prop_weight_threshold` - minimum amount of Respect voting `YES` for proposal to be eligible for passing;
- `veto_period` - second stage of proposal. Anyone can vote `NO` but no one can vote `YES`;
- `respect_contract` - contract storing Respect balances;

## Mechanism
<!-- TODO:
There's currently a problem with spam, where any respected member with more than 256 `prop_weight_threshold` could spam with many proposals and force honest members to waste a lot of gas vetoing each one. This could be solved by implementing the following changes:

* Each account has voting power, initially equal to his current Respect balance;
* Allow each vote to specify voting power to be used, which can be less than current Respect balance of account;
* Each `YES` vote subtracts from voting power of account. Voting power is returned after proposal is rejected or executed (execution can fail);
  * [ ] How will `NO` votes work with voting power?

This prevents spam because each respect holders have limited voting power, and so they have limited amount of proposals they could create per unit of time.

Plus this has other attractive features:
* Allowing respect-holders to signal how strongly they feel about a proposal;
* Incetivization to execute proposals (if your proposal is passed you only get your voting power back if someone executes it);
* The actions you can do are limited by the amount of Respect you hold. As a big respect-holder, the more contentious proposals you're trying to pass the less proposals you will pass (or you will pass them slower). This makes sense because reputation you've earned in the past, while it should give you power it should be limited based on what you're trying to do now.  -->
<!-- TODO: Check if this matches implementation -->

1. Anyone can create a proposal to execute some transaction;
2. For `voting_period` from proposal creation anyone can vote `YES` or `NO` on a proposal;
3. After `voting_period` from proposal creation, anyone can vote `NO`, but no one can vote `YES` on a proposal. This lasts for `veto_period`;
4. Every vote is weighted by the amount of Respect a voter has according to `respect_contract` at the time of the vote;
5. Proposal is said to be passed if all of these conditions hold:
   1. `voting_period + veto_period` has passed since proposal creation;
   2. At least `prop_weight_threshold` of Respect is voting `YES`;
   3. `yes_weight > 2 * no_weight`, where `yes_weight` is amount of Respect voting `YES` and `no_weight` is amount of Respect voting `NO`;
6. Passed proposal can be executed. Anyone can trigger execution;


### Rationale

The motivation behind this mechanism is to tolerate majority of participants being passive, allowing proposals to be passed without having high voter participation, while also enabling a community to rally around to block any proposal fairly easily. 

There’s a usually a big category of participants who are not proactive in governance decisions but are aware and would be able to react in case of contentious proposals being passed. The reason to block a proposal could simply be the perspective that proposal needs more consideration. So proactive governance participants could simply ask passive participant to “Veto” with an argument that “we need more discussion around this”. So passive voter would not need to understand the proposal fully to “Veto”, they would simply need to get a sense of it’s importance. This way we can utilize “passive but aware” category of participants for security thus avoiding reliance on any (typically arbitrary) quorum requirements and allowing organization to move forward even in cases of low voting turnout.

If we consider total turnout to be union of Respect voting in both stages then a one way to think about it, is that 2/3rds + 1 of turnout is able to pass a proposal, which also means that 1/3rd of turnout is able to block it.
