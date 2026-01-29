# Configuration reference

All per-frapp configuration lives in:

- `fractals/<frappId>/frapp.json` (committed)
- `fractals/<frappId>/frapp.local.json` (local-only)

For real examples, browse `fractals/*/frapp.json`.

## `frapp.json`

`frapp.json` is validated by `src/types/frapp.ts` and can be either:

- An **ORDAO frapp** (`appId: "ordao"`)
- An **external app redirect** (`appId: "externalApp"`)

### Base fields (all frapps)

- `id` (string)
- `fullName` (string)
- `description` (string, optional)
- `deploymentCfg` (object, optional)
- `symbol` (string, optional)
- `address` (eth address, optional)
- `app` (object)

### ORDAO frapp

Additional fields:

- `frappsSubdomains` (string[])
- `deploymentCfg` (required)
- `parentFrappId` (string, optional)

`deploymentCfg.network` is one of:

- `optimism`, `opSepolia`, `base`, `baseSepolia`

`deploymentCfg.module` is one of:

- `OrdaoExisting`
- `OrdaoNew`

`OrdaoExisting` uses an existing `deployment` object (addresses).

`OrdaoNew` is the common “new deployment” path and typically includes:

- vote settings (`votePeriod`, `vetoPeriod`, `voteThreshold`, `maxLiveYesVotes`)
- `oldRespectAddr`
- `ornodeOrigin`

`app` (`appId: "ordao"`) commonly includes:

- `startPeriodNum`
- `respect` metadata (`award`, `fungible`, `contract`)
- links (`parentRespectLink`, `childRespectLink`, `respectGameLink`)
- optional UI tuning (`defaultPropQuerySize`, `defaultAwardQuerySize`, `defBreakoutType`)

### externalApp

`app` (`appId: "externalApp"`) includes:

- `url` (string)

Optionally, `frappsSubdomains` may be present (used to generate redirect sites).

## `frapp.local.json`

This file is read at runtime for values you typically do not commit.

Fields:

- `providerUrl` (url string)
- `mongoCfg`
  - `url` (string)
  - `dbName` (string)
- `ornode` (object)
  - Common fields: `host`, `port`, `startPeriodNum`, `listenForEvents`
  - Store limits: `proposalStore`, `awardStore`, `voteStore`
  - Optional `sync` settings
- `privyAppId` (string)

## Generated outputs

The CLI will generate operational artifacts into `dist/`:

- `dist/deployments/<frappId>.json`
- `dist/proc/<frappId>/ornode.json`
- `dist/proc/<frappId>/ornode.pm2.json`
- `dist/sites/*.conf`
