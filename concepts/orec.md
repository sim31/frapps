# OREC
**Optimistic Respect-based Executive Contract (OREC)** is a smart contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here). It enables minority of proactive contributors to act on behalf of a DAO even if they hold a small amount of Respect (hence "optimistic" in the name). The security comes from a time delay between voting and execution during which other contributors can easily block a transaction if they collectively have at least half the Respect that initiators have.

## Specification

### Definitions

- *Proposal* - proposal to execute some transaction. Once proposal is passed this transaction can be executed;

### Variables

- `voting_period` - first stage of proposal. Anyone can vote either `YES` or `NO` here;
- `prop_weight_threshold` - minimum amount of Respect voting `YES` for proposal to be eligible for passing;
- `veto_period` - second stage of proposal. Anyone can vote `NO` but *no one* can vote `YES`;
- `respect_contract` - contract storing Respect balances;
- `max_live_votes` - limit for how many live proposals a single account can vote `YES` on;

### Mechanism
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

## Source
[Whitepaper in the original repo](https://github.com/sim31/ordao/blob/main/docs/OREC.md)


