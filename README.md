# ORDAO Fractal Apps (ORFRAPPS)

Scripts for deployment and maintenance of ORDAO deployments. Command line interface implementation to run all of that.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Repo layout and generated outputs](#repo-layout-and-generated-outputs)
- [CLI reference](./docs/cli.md)
- [Configuration reference](./docs/configuration.md)
- [Walkthroughs](#walkthroughs)
  - [Create a new ORDAO frapp configuration](#create-a-new-ordao-frapp-configuration)
  - [Deploy an ORDAO frapp (step-by-step)](#deploy-an-ordao-frapp-step-by-step)
  - [Managing multiple deployments on a single server](#managing-multiple-deployments-on-a-single-server)
- [Deploy under `frapps.xyz` vs self-host](#deploy-under-frappsxyz-vs-self-host)

---

## Prerequisites

### Runtime environment

- **Linux server** (recommended) for real deployments.
- **Node.js + npm** (recommended: Node 18+).
- **git**

### Web serving

- **nginx**
  - This repo generates nginx server blocks into `dist/sites/`.
  - You are expected to symlink/copy them into your nginx configuration and reload nginx.
- **TLS certificates** (recommended)
  - If you are serving a real domain, you typically want TLS via certbot/Let’s Encrypt.

### Process management

- **pm2** (recommended) for running `ornode` as a managed process.
  - The CLI can generate pm2 config files under `dist/proc/<frappId>/`.

### Database

- **MongoDB**
  - Recommended: **MongoDB Atlas** (managed).
  - Each frapp should have its own database name (`dbName`) even if sharing the same MongoDB cluster.

### Deployment requirements (ORDAO)

- An **RPC provider URL** for the target network (e.g. Optimism/Base mainnet or testnets).
- A **Privy App ID** for GUI auth (stored in `frapp.local.json`).

---

## Installation and setup

### Clone and initialize

From the repo root:

```bash
npm run init
```

What it does:

- Initializes git submodules.
- Installs root npm deps.
- Installs ORDAO deps in `./ordao` and builds ORDAO.
- Prints alias instructions.

To update later:

```bash
npm run update
```

### Type-checking

```bash
npm run check
```

### Shell alias (recommended)

This repo includes `./orfrapps-alias`. Source it to get a convenient shell function `orfrapps`.

```bash
source ./orfrapps-alias
orfrapps --help
```

Notes:

- The function will `cd` into the repo root automatically.
- Under the hood it runs `npm run start -- ...`.

---

## Repo layout and generated outputs

Each frapp lives in `fractals/<frappId>/`.

- **ORDAO codebase** lives in `./ordao/`.

- **`fractals/<frappId>/frapp.json`**
  - Committed config that defines a frapp.
- **`fractals/<frappId>/frapp.local.json`**
  - Local-only secrets/runtime settings (not meant to be committed).
- **`dist/deployments/<frappId>.json`**
  - Generated deployment output that contains deployed contract addresses for specific frapp.
- **`dist/proc/<frappId>/`**
  - Generated process configs (e.g. ornode config JSON, pm2 config JSON).
- **`dist/sites/`**
  - Generated nginx server blocks (`*.conf`).

## Walkthroughs

### Create a new ORDAO frapp configuration

This walkthrough covers **only** creating `frapp.json`.

1. Pick an ID.
   - Must match `^[a-z0-9-]{2,12}$`.
2. Create a new directory:

   ```bash
   mkdir -p fractals/<frappId>
   ```

3. Create `fractals/<frappId>/frapp.json`.

   Common ORDAO configuration pattern:

   ```json
   {
     "id": "my-fractal",
     "fullName": "My Fractal",
     "frappsSubdomains": [
       "myfractal"
     ],
     "parentFrappId": "parent-fractal",
     "deploymentCfg": {
       "network": "base",
       "module": "OrdaoNew",
       "oldRespectAddr": "0x0000000000000000000000000000000000000000",
       "votePeriod": 240,
       "vetoPeriod": 240,
       "voteThreshold": 256,
       "maxLiveYesVotes": 6,
       "ornodeOrigin": "https://myfractal-ornode.frapps.xyz"
     },
     "app": {
       "appId": "ordao",
       "startPeriodNum": 0,
       "parentRespectLink": "https://...",
       "childRespectLink": "https://...",
       "respectGameLink": "https://respect-game.vercel.app",
       "fractalDocsUrl": "https://raw.githubusercontent.com/sim31/frapps/refs/heads/main/fractals/my-fractal/",
       "respect": {
         "award": {
           "name": "My Fractal Respect Award",
           "description": "Award for participating in My Fractal",
           "image": "https://myfractal-ornode.frapps.xyz/static/logo.png"
         },
         "fungible": {
           "name": "My Fractal Respect",
           "description": "Respect score for participating in My Fractal",
           "image": "https://myfractal-ornode.frapps.xyz/static/logo.png",
           "decimals": 0
         },
         "contract": {
           "name": "My Fractal Respect",
           "symbol": "MYF",
           "description": "Awards for participating in My Fractal",
           "image": "https://myfractal-ornode.frapps.xyz/static/logo.png",
           "banner_image": "https://myfractal-ornode.frapps.xyz/static/logo.png",
           "featured_image": "https://myfractal-ornode.frapps.xyz/static/logo.png",
           "external_link": "https://myfractal.frapps.xyz"
         }
       }
     }
   }
   ```

4. Validate that the CLI can read it:

   ```bash
   orfrapps contracts <frappId> --config
   ```

If parsing fails, the CLI will error with the offending Zod validation error.

### Deploy an ORDAO frapp (step-by-step)

Prerequisites:

- You have a valid `frapp.json` for the frapp (see [Create a new ORDAO frapp configuration](#create-a-new-ordao-frapp-configuration) and [Configuration reference](./docs/configuration.md)).
- You have:
  - **Privy App ID** (for GUI auth)
  - **MongoDB instance** (recommended: MongoDB Atlas)
  - **RPC provider URL** for the selected network
- Your server has nginx and (recommended) pm2.

1. Create `fractals/<frappId>/frapp.local.json` with runtime/secrets.
2. Deploy ORDAO contracts (writes `dist/deployments/<frappId>.json`):

   ```bash
   orfrapps contracts <frappId> --all
   ```

3. Configure + run ornode:

   ```bash
   orfrapps ornode <frappId> --all
   npx pm2 start dist/proc/<frappId>/ornode.pm2.json
   ```

4. Configure + build GUI and create nginx sites:

   ```bash
   orfrapps gui <frappId> --all
   ```

5. Apply nginx configs:

- Inspect generated files in `dist/sites/`.
- Copy/symlink them into your nginx config (e.g. `/etc/nginx/sites-enabled/`).
- Reload nginx:

  ```bash
  nginx -s reload
  ```

6. (Optional) Build/configure docs site:

```bash
orfrapps orclient-docs --all
```

### Managing multiple deployments on a single server

Recommended operational model:

- **One ornode process per frapp** (pm2), with a dedicated port per frapp.
- **One MongoDB database per frapp** (`mongoCfg.dbName`).
- **nginx** terminates TLS and routes:
  - `ornode` as a reverse proxy to `http://localhost:<port>`
  - `gui` as a static site

Generated files to know:

- **Per-frapp process config**: `dist/proc/<frappId>/ornode.pm2.json`
- **Per-frapp ornode runtime config**: `dist/proc/<frappId>/ornode.json`
- **nginx sites**: `dist/sites/*.conf`

Practical guidance:

- **Ports**: ensure each frapp has a unique `frapp.local.json -> ornode.port`.
- **pm2 process names**: the CLI uses `${frappId}-ornode`.
- **nginx config management**: consider symlinking `dist/sites/` into your nginx config folder so you can regenerate configs without manually copying them each time.
- **Backups**: consider a cron job around `mongodump` and `pm2 save`.
- **Upgrades**:
  - `npm run update`
  - re-run relevant `orfrapps` commands to regenerate configs
  - restart pm2 processes as needed

---

## Deploy under `frapps.xyz` vs self-host

### If you want ORDAO hosted for your community under `frapps.xyz`
1. Create a frapp configuration (`frapp.json`) and either:
   - Open a pull request in this repo, or
   - Fill out this form:
     - https://docs.google.com/forms/d/e/1FAIpQLSdtVHemKjH78Z84PUZULZP3FxYRupt5YKQL5WSapb_sv8f1rQ/viewform
2. Create a contribution request in the [synchronous respect tree game](https://hackmd.io/@sim31/srt-1) we are currently playing biweekly [here](https://t.me/edenfractal/5562).
   - Reference your PR (if you created one).

### If you want to self-host ORDAO

Follow:

- [Create a new ORDAO frapp configuration](#create-a-new-ordao-frapp-configuration)
- [Deploy an ORDAO frapp (step-by-step)](#deploy-an-ordao-frapp-step-by-step)
