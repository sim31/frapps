# Optimistic Respect-based Executive Contract

**Optimistic Respect-based Executive Contract (OREC)** is a smart contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here). The main use case is performing code updates of a DAO (if OREC is set as an owner of a proxy contract) but it can be used for other transactions as well.

It is optimistic because it trusts a minority of contributors who take the initiative to act on behalf of a DAO even if they hold a small amount of Respect. The security comes from a time delay during which other contributors can easily block a transaction if they collectively have a significant enough amount of Respect relative to what the initiators have.

## Definitions

- *Proposal* - proposal to execute some transaction. Once proposal is passed this transaction can be executed;

## Variables

- `voting_period` - first stage of proposal. Anyone can vote either `YES` or `NO` here;
- `prop_weight_threshold` - minimum amount of Respect voting `YES` for proposal to be eligible for passing;
- `veto_period` - second stage of proposal. Anyone can vote `NO` but *no one* can vote `YES`;
- `respect_contract` - contract storing Respect balances;
- `max_live_votes` - limit for how many live proposals a single account can vote `YES` on;

## Mechanism
<!-- TODO: Check if this matches implementation -->

1. Anyone can create a proposal to execute some transaction;
2. For `voting_period` from proposal creation anyone can vote `YES` or `NO` on a proposal;
3. After `voting_period` from proposal creation, anyone can vote `NO`, but no one can vote `YES` on a proposal. This lasts for `veto_period`;
4. Every vote is weighted by the amount of Respect a voter has according to `respect_contract` at the time of the vote;
5. Proposal is said to be passed if all of these conditions hold:
   1. `voting_period + veto_period` time has passed since proposal creation;
   2. At least `prop_weight_threshold` of Respect is voting `YES`;
   3. `yes_weight > 2 * no_weight`, where `yes_weight` is amount of Respect voting `YES` and `no_weight` is amount of Respect voting `NO`;
6. Only passed proposals can be executed. Execution can be trigerred only once and anyone can trigger it;
7. Proposal is said to be *failed* or *rejected* if it is past the `voting_period` and either 5.2. or 5.3. conditions are *not* satisfied;
8. Proposal is said to be expired if it is rejected or its execution has been triggered. Otherwise proposal is said to be *live*;
9. Each account can only be voting `YES` on up to `max_live_votes` *live* proposals at a time;


### Rationale

The motivation behind this mechanism is to tolerate majority of participants being passive, allowing proposals to be passed without having high voter participation, while also enabling a community to rally around to block any proposal fairly easily. 

There’s a usually a big category of participants who are not proactive in governance decisions but are aware and would be able to react in case of contentious proposals being passed. The reason to block a proposal could simply be the perspective that proposal needs more consideration. So proactive governance participants could simply ask passive participant to “Veto” with an argument that “we need more discussion around this”. So passive voter would not need to understand the proposal fully to “Veto”, they would simply need to get a sense of it’s importance. This way we can utilize “passive but aware” category of participants for security thus avoiding reliance on any (typically arbitrary) quorum requirements and allowing organization to move forward even in cases of low voting turnout.

If we consider total turnout to be union of Respect voting in both stages then a one way to think about it, is that 2/3rds + 1 of turnout is able to pass a proposal, which also means that 1/3rd of turnout is able to block it.

#### Spam prevention
The purpose of 9th rule is to preven spam attacks. Without this rule, any respected member with more than `prop_weight_threshold` could spam with many proposals and force honest members to waste a lot of gas vetoing each one.
