# Optimistic Respect-based Executive Contract

**Optimistic Respect-based Executive Contract (OREC)** is a smart contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here). The main use case is performing code updates of a DAO (if OREC is set as an owner of a proxy contract) but it can be used for other transactions as well.

It is optimistic because it trusts a minority of contributors who take the initiative to act on behalf of a DAO even if they hold a small amount of Respect. The security comes from a time delay during which other contributors can easily block a transaction if they collectively have a significant enough amount of Respect relative to what the initiators have.

## Definitions

- "Proposal" - proposal to execute some transaction. Once proposal is passed this transaction can be executed;

## Variables

- `voting_period` = 1 day;
- `min_respect_threshold` = 256 Respect;
- `blocking_period` = 6 days;

## Mechanism

1. To pass a proposal it has to go through 2 stages: first the “voting
stage” and if it passes it, to the “blocking stage”;
2. In the voting stage a poll is created for a proposal with at least
the “Yes”, “No” and “Abstain” options. This is “voting poll” and it
lasts for `voting_period`. Votes are weighted by Respect of
the voter;
3. If at the end of `voting_period` at least
`min_respect_threshold` is voting for “Yes” and more than
2/3rds of all Respect voting on this poll are for “Yes”, then proposal
advances to the blocking stage;
4. In the blocking stage a poll is created for the same proposal with
only the “Veto” option. This is “blocking poll” and it lasts
`blocking_period`. Votes are weighted by Respect of the
voter;
5. If at the end of `blocking_period` the total Respect
weight of “Veto” votes on the “blocking poll” is at least half of the
total weight of “Yes” votes in the “voting poll” then a proposal is
rejected (but it can be resubmitted and go through the stages again).
Otherwise, a proposal is passed;
6. Passed proposal can be executed by anyone;

### Rationale

The motivation behind this mechanism is to tolerate majority of participants being passive, allowing proposals to be passed without having high voter participation, while also enabling a community to rally around to block any proposal fairly easily. 

There’s a usually a big category of participants who are not proactive in governance decisions but are aware and would be able to react in case of contentious proposals being passed. The reason to block a proposal could simply be the perspective that proposal needs more consideration. So proactive governance participants could simply ask passive participant to “Veto” with an argument that “we need more discussion around this”. So passive voter would not need to understand the proposal fully to “Veto”, they would simply need to get a sense of it’s importance. This way we can utilize “passive but aware” category of participants for security thus avoiding reliance on any (typically arbitrary) quorum requirements and allowing organization to move forward even in cases of low voting turnout.

If we consider total turnout to be union of Respect voting in both stages then a one way to think about it, is that 2/3rds + 1 of turnout is able to pass a proposal (which means that 1/3rd of turnout is also able to block it). This is because 1/3rd is half of 2/3rds, so by requiring Veto votes to weight at least half of “Yes” votes we make it so that 1/3rd of active voters can block a proposal[1](about:blank#fn1).

