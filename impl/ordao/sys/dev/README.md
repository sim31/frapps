# Ordao System

Configuration and scripts to develop / test / deploy whole [Ordao](../ordao/) system.

## Dependencies
* NodeJS;
* npm;
* MongoDB ([install instructions](https://www.mongodb.com/docs/manual/administration/install-community/#std-label-install-mdb-community-edition))

## Start
Run `npm run setup` to install all node dependencies, make initial build and setup everything needed for this repo to work.

## Test
Test contracts
```
npm run test-contracts
```

Integration tests (contracts - ornode - orclient) (might take some time):
```
npm run test-ordao
```

Run all tests
```
npm run test
```

## Run development environment
The following command builds and launches all the necessary services locally as well as the frontend.
```
npm run dev
```

Frontend is available at http://localhost:5173 . Currently it's not a functional UI, but [you can interact with the system through browser console](#interacting-with-ordao-through-browser-console)

### Interacting with ordao through browser console
Open browser console (ctrl+shift+I). From there you can access js object called `cli`. Enter 
```
> cli.__proto__
```
to list all the methods available on this object.

Some methods have some help text with examples avaible as `help` property. For example:
```
> cli.proposeTick.help()

async proposeTick(
  req: TickRequest = {},
  vote: VoteWithPropRequest = { vote: VoteType.Yes }
): Promise<PutProposalRes> {

Proposal to increment period number, which is used to determine meeting number automatically.

...rest or the output...

```

Some key comands:
* `cli.submitBreakoutResults.help()`
* `cli.vote.help()`
* `cli.lsProposals()`
* `cli.execute.help()`
* `cli.proposeRespectTo.help()`

<!-- TODO: document issue with browser restarting -->




