# Optimistic Respect-based Executive Contract (OREC)

[Concept](../../concepts/OREC.md).


```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Lifecycle of Proposal

```mermaid
stateDiagram-v2
  state createState <<fork>>
  state execState <<fork>>
  [*] --> createState: ProposalCreated
  createState --> passing: yesWeight >= minWeight
  createState --> failing: yesWeight < minWeight
  passing --> failing: noWeight * 2 >= yesWeight
  failing --> passing: noWeight * 2 < yesWeight
  failing --> failed: vote time over
  passing --> veto: vote time over
  veto --> passed: veto time over
  veto --> failed: noWeight * 2 >= yesWeight
  passed --> execState: execute called by someone
  execState --> executed
  execState --> execFailed


  state "Failing" as failing {
    direction LR
    state "Stage = Voting" as failingStage
    state "VoteStatus = Failing" as failingVT
    state "ExecStatus = NotExecuted" as failingExec
  }

  state "Passing" as passing {
    direction LR
    state "Stage = Voting" as passingStage
    state "VoteStatus = Passing" as passingvt
    state "ExecStatus = NotExecuted" as passingExec
  }

  state "VetoTime" as veto {
    direction LR
    state "Stage = Veto" as vetoStage
    state "VoteStatus = Passing" as vetovt
    state "ExecStatus = NotExecuted" as vetoExec
  }

  state "Failed" as failed {
    direction LR
    state "Stage = Expired" as failedStage
    state "VoteStatus = Failed" as failedvt
    state "ExecStatus = NotExecuted" as failedExec
  }

  state "Passed" as passed {
    direction LR
    state "Stage = Execution" as passedStage
    state "VoteStatus = Passed" as passedvt
    state "ExecStatus = NotExecuted" as passedExec
  }

  state "Executed" as executed {
    direction LR
    state "Stage = Expired" as execStage
    state "VoteStatus = Passed" as execvt
    state "ExecStatus = Executed" as execExec
  }

  state "ExecutionFailed" as execFailed {
    direction LR
    state "Stage = Expired" as execfStage
    state "VoteStatus = Passed" as execfvt
    state "ExecStatus = ExecutionFailed" as execfExec
  }

```


