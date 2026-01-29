# ORFRAPPS CLI reference

This repo provides a CLI called `orfrapps` for deploying and operating ORDAO frapps.

## Running the CLI

Recommended:

```bash
source ./orfrapps-alias
orfrapps --help
```

Alternatively:

```bash
npm run start -- --help
```

## Targets

Most commands accept `[targets...]`:

- `all` (default): run for every `fractals/<frappId>/frapp.json`
- One or more IDs: `orf ef2`

## Commands

### `init`

Install ORDAO dependencies.

```bash
orfrapps init
```

### `contracts [targets...]`

Build/configure/deploy ORDAO contracts.

Options:

- `-b, --build` Build contracts (also syncs sources into `contracts/src`).
- `-c, --config` Generate ignition parameters.
- `-d, --deploy` Deploy via Hardhat ignition.
- `--reset` Reset an existing ignition deployment (only meaningful with `--deploy`).
- `-v, --verify` Verify deployment.
- `-o, --output` Write deployment info into `dist/deployments/<frappId>.json`.
- `-a, --all` Shorthand for `-bcdvo`.

Examples:

```bash
orfrapps contracts orf --all
orfrapps contracts all --build --config
```

### `ornode [targets...]`

Build/configure ornode instances, generate nginx configs, and generate pm2 configs.

Options:

- `-n, --domain <domain>` Parent domain (default `frapps.xyz`).
- `-l, --clean` Clean build.
- `-b, --build` Build.
- `-c, --config` Generate `dist/proc/<frappId>/ornode.json`.
- `-s, --config-sites` Generate nginx proxy configs into `dist/sites/`.
- `-p, --config-process` Generate pm2 config into `dist/proc/<frappId>/ornode.pm2.json`.
- `-d, --db-backup` Backup MongoDB (see command code for env vars).
- `-e, --export [img-dir-url]` Export data from MongoDB.
- `-a, --all` Shorthand for `-lbcsp`.

Start a generated pm2 config:

```bash
npx pm2 start dist/proc/<frappId>/ornode.pm2.json
```

### `ornode-sync <from-block> <to-block> [targets...]`

One-off sync run for a given block range (useful if ornode missed events).

Options:

- `-s, --step-range <step-range>` Size of sync steps (default `8000`).

### `gui [targets...]`

Configure/build GUI and generate nginx site configs.

Options:

- `-n, --domain <domain>` Parent domain (default `frapps.xyz`).
- `-l, --clean` Clean GUI build output.
- `-c, --config` Generate GUI env config.
- `-b, --build` Build GUI.
- `-s, --config-site` Generate nginx static site configs into `dist/sites/`.
- `-a, --all` Shorthand for `-lcbs`.

### `orclient-docs`

Build and configure the orclient docs site.

Options:

- `-n, --domain <domain>` Parent domain (default `frapps.xyz`).
- `-l, --clean` Clean build.
- `-b, --build` Build.
- `-s, --config-sites` Generate nginx static site config.
- `-a, --all` Shorthand for `-lbs`.

### `rsplits [targets...]`

Generate split percentage CSVs.

Options:

- `-c, --output-csv` Write CSV output.
- `-a, --all` Shorthand for `-c`.

### `parent-deploy <target> <network>`

Deploy parent Respect distributions.

Options:

- `-b, --build` Build contracts (also syncs sources).
- `-c, --config` Generate ignition parameters.
- `-d, --deploy` Deploy.
- `-v, --verify` Verify.
- `-o, --output` Write output into `dist/deployments/<frappId>.json`.
- `-a, --all` Shorthand for `-bcdvo`.

### `externalApp config [targets...]`

Generate nginx redirect sites for `externalApp` frapps.

```bash
orfrapps externalApp config all --domain frapps.xyz
```
