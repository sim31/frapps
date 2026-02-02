# Configuration Reference

This document describes all configuration options for frapps.

## Configuration Files

### `frapp.json`

Main configuration file for a fractal. Located at `fractals/<frapp-id>/frapp.json`.

This file is **committed to the repository** and contains public configuration.

#### Base Fields (All Frapps)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Short identifier (2-12 chars, lowercase alphanumeric and hyphens). Must be unique. Must match `<frapp-id>` in the path `fractals/<frapp-id>/frapp.json`. |
| `fullName` | string | Yes | Full name/title of the fractal |
| `description` | string | No | Description of the fractal |
| `symbol` | string | No | Token symbol for the fractal |
| `address` | string | No | Ethereum address associated with the fractal |

#### ORDAO-Specific Fields

Additional fields when `app.appId` is `"ordao"`:

<!-- TODO: Documentation for what is "parent fractal" -->
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frappsSubdomains` | string[] | Yes | Subdomains for this fractal. Empty string means root domain. Must be unique across all frapps. |
| `parentFrappId` | string | No | ID of parent fractal |

#### Deployment Configuration (`deploymentCfg`)

##### For New Deployments (`module: "OrdaoNew"`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `module` | `"OrdaoNew"` | Yes | Deployment module type |
| `network` | string | Yes | Network ID: `"optimism"`, `"opSepolia"`, `"base"`, or `"baseSepolia"` (create an issue if you want more supported) |
| `oldRespectAddr` | string | Yes | Address of old respect contract (Ethereum address). See [OREC spec](https://github.com/sim31/ordao/blob/main/docs/OREC.md#specification). |
| `votePeriod` | number | Yes | Voting period in seconds (see [OREC spec](https://github.com/sim31/ordao/blob/main/docs/OREC.md#specification)) |
| `vetoPeriod` | number | Yes | Veto period in seconds (see [OREC spec](https://github.com/sim31/ordao/blob/main/docs/OREC.md#specification)) |
| `voteThreshold` | number | Yes | Vote threshold (see [OREC spec](https://github.com/sim31/ordao/blob/main/docs/OREC.md#specification)) |
| `maxLiveYesVotes` | number | Yes | Maximum live yes votes (see [OREC spec](https://github.com/sim31/ordao/blob/main/docs/OREC.md#specification)) |
| `ornodeOrigin` | string | Yes | Ornode origin URL (e.g., `"https://ef2-ornode.frapps.xyz"`) |


##### For Existing Deployments (`module: "OrdaoExisting"`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `module` | `"OrdaoExisting"` | Yes | Deployment module type |
| `network` | string | Yes | Network ID |
| `deployment` | object | Yes | Existing deployment addresses (see below) |
| `ornodeOrigin` | string | No | Ornode origin URL |

**Deployment object fields:**
- `oldRespect` - Address of old respect contract
- `orec` - Address of OREC contract
- `newRespect` - Address of new respect contract

#### App Configuration (`app`)

When `app.appId` is `"ordao"`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `appId` | `"ordao"` | Yes | Application identifier |
| `startPeriodNum` | number | Yes | Starting period number (non-negative integer) |
| `parentRespectLink` | string | Yes | URL to parent respect page |
| `childRespectLink` | string | Yes | URL to child respect page |
| `respectGameLink` | string | Yes | URL to respect game |
| `defaultPropQuerySize` | number | No | Default proposal query size (positive integer) |
| `defaultAwardQuerySize` | number | No | Default award query size (positive integer) |
| `fractalDocsUrl` | string | No | URL to documentation about a fractal (will be used in about page of [GUI](../ordao/apps/gui/)) |
| `oldRespectDecimals` | number | No | Number of decimals for old respect token |
| `defBreakoutType` | string | No | Default breakout type: `"respectBreakout"` (fibonacci starting with 5) or `"respectBreakoutX2"` (fibonacci startign with 5) * 2 |

#### Respect Configuration (`app.respect`)

Nested under `app` field:

##### Award Metadata (`app.respect.award`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the respect award |
| `description` | string | No | Description of the award |
| `image` | string | No | Image URL for the award |

##### Fungible Token (`app.respect.fungible`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of fungible respect token |
| `description` | string | No | Description of the token |
| `image` | string | No | Image URL for the token |
| `decimals` | number | Yes | Number of decimals |

##### Contract Metadata (`app.respect.contract`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Contract name |
| `symbol` | string | Yes | Contract symbol |
| `description` | string | No | Contract description |
| `image` | string | No | Contract image URL |
| `banner_image` | string | No | Banner image URL |
| `featured_image` | string | No | Featured image URL |
| `external_link` | string | No | External link URL |

---

### `frapp.local.json`

Local configuration file for runtime secrets. Located at `fractals/<frapp-id>/frapp.local.json`.

This file is **NOT committed** (gitignored) and contains sensitive configuration.

#### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `providerUrl` | string | Yes | RPC provider URL for blockchain connection |
| `privyAppId` | string | Yes | Privy application ID for authentication |
| `mongoCfg` | object | Yes | MongoDB configuration (see below) |
| `ornode` | object | Yes | Ornode runtime configuration (see below) |

#### MongoDB Configuration (`mongoCfg`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | MongoDB connection URL |
| `dbName` | string | Yes | Database name (has to be unique for each frapp) |

#### Ornode Configuration (`ornode`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `host` | string | No | Host to bind to (default: `"localhost"`) |
| `port` | number | No | Port to listen on (default: `8090`) |
| `startPeriodNum` | number | No | Starting period number (default: `0`) |
| `listenForEvents` | boolean | No | Listen for blockchain events (default: `true`) |
| `wsResetInterval` | number | No | WebSocket reset interval in seconds, 0 for never (default: `0`) |
| `defBreakoutType` | string | No | Default breakout type (default: `"respectBreakout"`) |
| `proposalStore` | object | No | Proposal store configuration |
| `awardStore` | object | No | Award store configuration |
| `voteStore` | object | No | Vote store configuration |
| `sync` | object | No | Blockchain sync configuration (see below) |

#### Sync Configuration (`ornode.sync`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromBlock` | number | Yes | Starting block number (non-negative) |
| `toBlock` | number\|`"latest"` | Yes | Ending block number or `"latest"` |
| `stepRange` | number | No | Block range per sync step (default: `8000`) |

---

## Example Configurations

### Example `frapp.json` (ORDAO New Deployment)

```json
{
  "id": "ef2",
  "fullName": "Eden Fractal",
  "frappsSubdomains": ["ef2", "ef", "eden"],
  "deploymentCfg": {
    "network": "base",
    "module": "OrdaoNew",
    "oldRespectAddr": "0xc74635243E379FD0F63f12CDD7cA7EEEbf25af5b",
    "votePeriod": 777600,
    "vetoPeriod": 777600,
    "voteThreshold": 1000,
    "maxLiveYesVotes": 4,
    "ornodeOrigin": "https://ef2-ornode.frapps.xyz"
  },
  "app": {
    "appId": "ordao",
    "startPeriodNum": 120,
    "parentRespectLink": "https://of-base.frapps.xyz/ef/accounts",
    "childRespectLink": "https://base.blockscout.com/address/0xa3E495f17590946e53fa5F3C1497EF1367F230fA",
    "respectGameLink": "https://fractalgram.frapps.xyz",
    "fractalDocsUrl": "https://raw.githubusercontent.com/sim31/frapps/refs/heads/main/fractals/ef2/",
    "respect": {
      "award": {
        "name": "Eden Fractal Epoch 2 Respect Award",
        "description": "Respect award for a contribution to Eden Fractal in Epoch 2",
        "image": "https://gateway.pinata.cloud/ipfs/bafybeifwiv3xo665t7faxtieu3mt24fxzd2mb5mfvh2mtvn76nw5fgm7ki"
      },
      "fungible": {
        "name": "Eden Fractal Epoch 2 Respect",
        "description": "Respect score for a contributions to Eden Fractal in Epoch 2",
        "image": "https://gateway.pinata.cloud/ipfs/bafybeifwiv3xo665t7faxtieu3mt24fxzd2mb5mfvh2mtvn76nw5fgm7ki",
        "decimals": 0
      },
      "contract": {
        "name": "Eden Fractal Epoch 2 Respect",
        "symbol": "ERF2",
        "description": "Awards for a contributions to Eden Fractal in Epoch 2",
        "image": "https://gateway.pinata.cloud/ipfs/bafybeifwiv3xo665t7faxtieu3mt24fxzd2mb5mfvh2mtvn76nw5fgm7ki",
        "banner_image": "https://gateway.pinata.cloud/ipfs/bafybeifwiv3xo665t7faxtieu3mt24fxzd2mb5mfvh2mtvn76nw5fgm7ki",
        "featured_image": "https://gateway.pinata.cloud/ipfs/bafybeifwiv3xo665t7faxtieu3mt24fxzd2mb5mfvh2mtvn76nw5fgm7ki",
        "external_link": "https://ef2.frapps.xyz"
      }
    }
  }
}
```

### Example `frapp.local.json`

```json
{
  "providerUrl": "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "privyAppId": "your-privy-app-id",
  "mongoCfg": {
    "url": "mongodb+srv://username:password@cluster.mongodb.net/",
    "dbName": "ef2-ordao"
  },
  "ornode": {
    "host": "localhost",
    "port": 8090,
    "startPeriodNum": 120,
    "listenForEvents": true,
    "wsResetInterval": 3600,
    "sync": {
      "fromBlock": 12345678,
      "toBlock": "latest",
      "stepRange": 8000
    }
  }
}
```

## Validation

All configuration files are validated using Zod schemas. Invalid configurations will cause errors when running orfrapps commands.

Common validation rules:
- `id`: 2-12 characters, lowercase letters, numbers, and hyphens only
- Ethereum addresses: Must be valid hex addresses starting with `0x`
- URLs: Must be valid URLs with protocol
- Numbers: Must be within specified ranges (e.g., non-negative for block numbers)
