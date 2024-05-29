# Optimistic Respect-based Executive Contract

**Optimistic Respect-based Executive Contract (OREC)** is a smart contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here). The main use case is performing code updates of a DAO (if OREC is set as an owner of a proxy contract) but it can be used for other transactions as well.

It is optimistic because it trusts a minority of contributors who take the initiative to act on behalf of a DAO even if they hold a small amount of Respect. The security comes from a time delay during which other contributors can easily block a transaction if they collectively have a significant enough amount of Respect relative to what the initiators have.

## Definitions

- *Proposal* - proposal to execute some transaction. Once proposal is passed this transaction can be executed;
- *Disstrust vote* - a vote against an account instead of proposal, which signals that the issuer of this vote is automatically against anything that another account votes `YES` for;

## Variables

- `voting_period` - first stage of proposal. Anyone can vote either `YES` or `NO` here;
- `prop_weight_threshold` - minimum amount of Respect voting `YES` for proposal to be eligible for passing;
- `veto_period` - second stage of proposal. Anyone can vote `NO` but no one can vote `YES`;
- `respect_contract` - contract storing Respect balances;

## Mechanism

1. Anyone can create a proposal to execute some transaction;
2. For `voting_period` from proposal creation anyone can vote `YES` or `NO` on a proposal;
3. After `voting_period` from proposal creation, anyone can vote `NO`, but no one can vote `YES` on a proposal. This lasts for `veto_period`;
4. Every vote is weighted by the amount of Respect a voter has according to `respect_contract` at the time of the vote;
5. After `voting_period + veto_period` from proposal creation, proposal is said to be passed if all of these conditions hold:
   1. At least `prop_weight_threshold` of Respect is voting `YES`;
   2. `yes_weight > 2 * no_weight`, where `yes_weight` is amount of Respect voting `YES` and `no_weight` is amount of Respect voting `NO`;
6. Any account can issue *distrust vote* against another account;
  1. If this happens then whenever distrusted account votes `YES`, the issuer of *distrust vote* is automatically counted as voting `NO` on the same proposal (without him having to take any additional action);
  2. *Distrust vote* can be unregistered at any time, but it does not undo any automatic `NO` votes which have already happened;
7. Passed proposal can be executed. Anyone can trigger execution;


### Rationale

The motivation behind this mechanism is to tolerate majority of participants being passive, allowing proposals to be passed without having high voter participation, while also enabling a community to rally around to block any proposal fairly easily. 

There’s a usually a big category of participants who are not proactive in governance decisions but are aware and would be able to react in case of contentious proposals being passed. The reason to block a proposal could simply be the perspective that proposal needs more consideration. So proactive governance participants could simply ask passive participant to “Veto” with an argument that “we need more discussion around this”. So passive voter would not need to understand the proposal fully to “Veto”, they would simply need to get a sense of it’s importance. This way we can utilize “passive but aware” category of participants for security thus avoiding reliance on any (typically arbitrary) quorum requirements and allowing organization to move forward even in cases of low voting turnout.

If we consider total turnout to be union of Respect voting in both stages then a one way to think about it, is that 2/3rds + 1 of turnout is able to pass a proposal, which means that 1/3rd of turnout is also able to block it.

<!-- #### Distrust vote
Without distrust vote any Respect holder which has at least `prop_weight_threshold` could flood the contract with proposals which  -->
