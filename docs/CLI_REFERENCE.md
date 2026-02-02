# orfrapps CLI Reference

The `orfrapps` command-line tool manages ORDAO deployments for fractal organizations.

## Installation & Setup

After running the [init script](../README.md#installation), source the alias file:

```bash
source ./orfrapps-alias
```

This creates the `orfrapps` command that can be run from any directory.

## Commands

### `orfrapps contracts [targets...]`

Deploy and manage smart contracts for ORDAO instances.

```bash
orfrapps contracts [targets...] [options]
```

**Arguments:**
- `targets` - Frapp IDs to target (default: `all`)

**Options:**
- `-b, --build` - Build contracts
- `-c, --config` - Generate deployment configuration (parameters for hardhat ignition)
- `-d, --deploy` - Deploy contracts using Hardhat Ignition
- `--reset` - Clear previous deployment (only with `-d`)
- `-v, --verify` - Verify contracts on block explorer
- `-o, --output` - Output deployment info to `dist/deployments/`
- `-a, --all` - Shorthand for `-bcdvo`

**Examples:**

```bash
# Deploy contracts for all frapps
orfrapps contracts all -a

# Deploy for specific frapp
orfrapps contracts ef2 -a

# Just build and configure
orfrapps contracts ef2 -bc

# Deploy with reset
orfrapps contracts ef2 -d --reset
```

**Output:**
- Deployment info written to `dist/deployments/<frapp-id>.json`
- Ignition config written to `contracts/ignition/<frapp-id>.json`

---

### `orfrapps ornode [targets...]`

Configure and manage ornode (ORDAO backend) instances.

```bash
orfrapps ornode [targets...] [options]
```

**Arguments:**
- `targets` - Frapp IDs to target (default: `all`)

**Options:**
- `-n, --domain <domain>` - Domain name (default: `frapps.xyz`)
- `-l, --clean` - Clean ornode build
- `-b, --build` - Build ornode
- `-c, --config` - Configure ornode instances
- `-s, --config-sites` - Configure nginx server blocks
- `-p, --config-process` - Create PM2 process configuration
- `-d, --db-backup` - Backup ornode database
- `-e, --export [img-dir-url]` - Export ornode database
- `-a, --all` - Shorthand for `-lbcsp`

**Examples:**

```bash
# Configure and build ornode for all frapps
orfrapps ornode all -a

# Configure for specific frapp
orfrapps ornode ef2 -c

# Export database
orfrapps ornode ef2 -e "https://example.com/images"
```

**Output:**
- Ornode config written to `proc/<frapp-id>/ornode.json`
- PM2 config written to `proc/<frapp-id>/ornode.pm2.json`
- Nginx site config written to `sites/<subdomain>-ornode.frapps.xyz`

**Starting ornode:**

```bash
npx pm2 start proc/<frapp-id>/ornode.pm2.json
```

---

### `orfrapps gui [targets...]`

Build and configure the ORDAO web interface.

```bash
orfrapps gui [targets...] [options]
```

**Arguments:**
- `targets` - Frapp IDs to target (default: `all`)

**Options:**
- `-n, --domain <domain>` - Domain name (default: `frapps.xyz`)
- `-l, --clean` - Clean GUI builds
- `-c, --config` - Configure GUI build environment
- `-b, --build` - Build GUI
- `-s, --config-site` - Configure nginx server blocks
- `-a, --all` - Shorthand for `-lcbs`

**Examples:**

```bash
# Build GUI for all frapps
orfrapps gui all -a

# Build for specific frapp
orfrapps gui ef2 -a

# Just configure
orfrapps gui ef2 -c
```

**Output:**
- GUI build written to `ordao/apps/gui/builds/<frapp-id>/`
- Build config written to `ordao/apps/gui/builds/<frapp-id>.env.json`
- Nginx site config written to `sites/<subdomain>.frapps.xyz`

---

### `orfrapps orclient-docs`

Build and configure [orclient](../ordao/libs/orclient/) documentation website.

This is currently deployed on frapps.xyz here: https://orclient-docs.frapps.xyz/

```bash
orfrapps orclient-docs [options]
```

**Options:**
- `-n, --domain <domain>` - Domain name (default: `frapps.xyz`)
- `-l, --clean` - Clean build
- `-b, --build` - Build documentation
- `-s, --config-sites` - Configure nginx server blocks
- `-a, --all` - Shorthand for `-lbs`

**Example:**
```bash
# Build and configure orclient docs
orfrapps orclient-docs -a
```

---

### `orfrapps ornode-sync <from-block> <to-block> [targets...]`

Synchronize ornode with blockchain events. Queries for relevant blockchain events in specified block range. Use when some blockchain events were missed.

```bash
orfrapps ornode-sync <from-block> <to-block> [targets...] [options]
```

**Arguments:**
- `from-block` - Starting block number (required)
- `to-block` - Ending block number (required)
- `targets` - Frapp IDs to target (default: `all`)

**Options:**
- `-s, --step-range <step-range>` - Size of sync steps for querying eth node (default: `8000`)

**Prerequisites:**
- Ornode configs must be generated for each frapp before running sync

**Example:**
```bash
# Sync from block 12345678 to latest for specific frapp
orfrapps ornode-sync 12345678 latest ef2

# Sync with custom step range
orfrapps ornode-sync 12345678 13000000 ef2 -s 5000
```

---

### `orfrapps rsplits [targets...]`

Generate CSV files for creating [splits](https://splits.org/) contracts based on Respect distributions.

```bash
orfrapps rsplits [targets...] [options]
```

**Arguments:**
- `targets` - Frapp IDs to target (default: `all`)

**Options:**
- `-c, --output-csv` - Create CSV file with percentages to create splits from
- `-a, --all` - Shorthand for `-c`

**Example:**
```bash
# Generate splits CSV for specific frapp
orfrapps rsplits ef2 -c
```

---

### `orfrapps parent-deploy <target> <network>`

Deploy parent fractal respect distribution on specified networks.

```bash
orfrapps parent-deploy <target> <network> [options]
```

**Arguments:**
- `target` - Frapp ID to deploy (required)
- `network` - Network to deploy to: `optimism`, `opSepolia`, `base`, or `baseSepolia` (required)

**Options:**
- `-b, --build` - Build contracts
- `-c, --config` - Configure (prepare) for deployment
- `-d, --deploy` - Deploy
- `-v, --verify` - Verify contracts on block explorer
- `-o, --output` - Output deployment info to dist/deployments folder
- `-a, --all` - Shorthand for `-bcdvo`

**Example:**
```bash
# Deploy parent respect distribution to Base
orfrapps parent-deploy ef2 base -a
```

---

### `orfrapps externalApp config [targets...]`

Configure external (non-ORDAO) applications.

```bash
orfrapps externalApp config [targets...]
```

**Arguments:**
- `targets` - Frapp IDs to target (default: `all`)

## Common Workflows

### Full Deployment

```bash
# 1. Deploy contracts
orfrapps contracts <frapp-id> -a

# 2. Configure and build ornode
orfrapps ornode <frapp-id> -a

# 3. Start ornode
npx pm2 start proc/<frapp-id>/ornode.pm2.json

# 4. Build and configure GUI
orfrapps gui <frapp-id> -a
```

### Update Existing Deployment

```bash
# Rebuild ornode
orfrapps ornode <frapp-id> -lb

# Restart ornode
npx pm2 restart <frapp-id>-ornode

# Rebuild GUI
orfrapps gui <frapp-id> -lb
```

## Environment Variables

### For ornode commands:
- `BACKUP_DIR` - Directory for database backups
- `MONGO_DUMP_URI` - MongoDB connection string for backups

### For contract deployment:
Set in `.env` file in `contracts/` directory:
- Network-specific RPC URLs and private keys (see Hardhat config)
