# ORDAO Fractal Apps (ORFrapps)

Configuration and scripts for deployment and maintenance of ORDAO instances serving [Fractal communities](https://optimystics.io/blog/fractalhistory).

This repository contains:
- Configuration files for ORDAO instances
- Deployment scripts
- Documentation
- Command-line tools for configuration, deployment, and maintenance of ORDAO


## Table of Contents

- [Reader Guide](#reader-guide)
  - [I want ORDAO deployed for my community under frapps.xyz](#i-want-ordao-deployed-for-my-community-under-frappsxyz)
  - [I want to self-host ORDAO](#i-want-to-self-host-ordao)
  - [I want to understand the configuration options for ORDAO instances](#i-want-to-understand-the-configuration-options-for-ordao-instances)
  - [I want to use the CLI tools](#i-want-to-use-the-cli-tools)
- [Quick Start (Self-Hosting)](#quick-start-self-hosting)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Update](#update)
  - [Basic Usage](#basic-usage)
- [Repository Structure](#repository-structure)
- [Documentation](#documentation)
  - [Guides](#guides)
  - [Reference](#reference)
  - [Examples](#examples)
- [Key Concepts](#key-concepts)
  - [Frapp](#frapp)
  - [Components](#components)
- [orfrapps CLI](#orfrapps-cli)
- [Contributing](#contributing)
  - [Adding a New Fractal Configuration](#adding-a-new-fractal-configuration)
  - [Development](#development)
- [Support](#support)
- [License](#license)
- [Related Projects](#related-projects)

## Reader Guide

### I want ORDAO deployed for my community under frapps.xyz

**Follow these steps:**

1. **Create your configuration** - Either:
   - Create a `frapp.json` configuration file and submit a pull request
     - See [Configuration Walkthrough](./docs/WALKTHROUGH_CONFIGURE.md)
   - Or fill out this [configuration form](https://docs.google.com/forms/d/e/1FAIpQLSdtVHemKjH78Z84PUZULZP3FxYRupt5YKQL5WSapb_sv8f1rQ/viewform)

2. **Request deployment** - Create a contribution request in the [Synchronous Respect Tree Game](https://hackmd.io/@sim31/srt-1) we play biweekly ([Telegram discussion](https://t.me/edenfractal/5562)). Reference your PR or form submission. Vote for it and ask other respect-holders to vote;

### I want to self-host ORDAO

**Follow these guides in order:**

1. [Configuration Walkthrough](./docs/WALKTHROUGH_CONFIGURE.md) - Create your `frapp.json`
2. [Deployment Walkthrough](./docs/WALKTHROUGH_DEPLOY.md) - Deploy on your server
3. [Multiple Deployments Guide](./docs/MULTIPLE_DEPLOYMENTS.md) - (Optional) Run multiple instances of ORDAO on the same server;

**Prerequisites:**
- Linux server with nginx
- MongoDB instance (recommend [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Privy App ID ([privy.io](https://privy.io))
- Domain name with DNS access

### I want to understand the configuration options for ORDAO instances

See the [Configuration Reference](./docs/CONFIGURATION.md) for complete documentation of:
- `frapp.json` - Public configuration (committed to repo)
- `frapp.local.json` - Local secrets (not committed)

### I want to use the CLI tools

See the [CLI Reference](./docs/CLI_REFERENCE.md) for complete command documentation.

## Quick Start (Self-Hosting)

### Prerequisites

- Linux server
- Node.js 18+
- Nginx
- MongoDB instance
- Privy App ID

### Installation

```bash
# Clone repository
git clone https://github.com/sim31/frapps.git
cd frapps

# Initialize (installs dependencies, builds ORDAO)
npm run init

# Setup CLI alias
source ./orfrapps-alias
```

### Update


```bash
# Pull the newest version of orfrapps
git pull

# Update repository and dependencies
npm run update

# Re-source alias
source ./orfrapps-alias
```

### Basic Usage
Assuming you have [created configuration](./docs/WALKTHROUGH_CONFIGURE.md) for `<frapp-id>`:

```bash
# Deploy contracts
orfrapps contracts <frapp-id> -a

# Configure and start ornode
orfrapps ornode <frapp-id> -a
npx pm2 start proc/<frapp-id>/ornode.pm2.json

# Build and deploy GUI
orfrapps gui <frapp-id> -a

# Reload nginx
sudo nginx -s reload
```

See [Deployment Walkthrough](./docs/WALKTHROUGH_DEPLOY.md) for detailed instructions.

## Repository Structure

```
frapps/
├── fractals/           # Fractal configurations
│   ├── ef2/           # Example: Eden Fractal
│   │   ├── frapp.json        # Public config
│   │   └── frapp.local.json  # Local secrets (gitignored)
│   └── ...
├── ordao/             # ORDAO submodule
├── src/               # CLI implementation
├── contracts/         # Smart contract deployment
├── docs/              # Documentation
│   ├── CLI_REFERENCE.md
│   ├── CONFIGURATION.md
│   ├── WALKTHROUGH_CONFIGURE.md
│   ├── WALKTHROUGH_DEPLOY.md
│   └── MULTIPLE_DEPLOYMENTS.md
└── dist/              # Build outputs (generated)
    ├── proc/          # Process configurations
    ├── sites/         # Nginx configurations
    └── deployments/   # Contract deployment info
```

## Documentation

### Guides
- **[Configuration Walkthrough](./docs/WALKTHROUGH_CONFIGURE.md)** - Step-by-step guide to create `frapp.json`
- **[Deployment Walkthrough](./docs/WALKTHROUGH_DEPLOY.md)** - Complete deployment process
- **[Multiple Deployments](./docs/MULTIPLE_DEPLOYMENTS.md)** - Managing multiple instances on one server

### Reference
- **[CLI Reference](./docs/CLI_REFERENCE.md)** - Complete `orfrapps` command documentation
- **[Configuration Reference](./docs/CONFIGURATION.md)** - All config file options

### Examples
- **[fractals/](./fractals/)** - Real-world frapp configurations

## Key Concepts

### Frapp
A "frapp" (fractal app) is a configured ORDAO instance for a specific fractal community. Each frapp has:
- Unique ID (e.g., `ef2`, `zaof`)
- Configuration in `fractals/<frapp-id>/frapp.json`
- Optional local config in `fractals/<frapp-id>/frapp.local.json` (this is not committed to source control);

### ORDAO components for each frapp

**[Smart Contracts](./ordao/contracts/):**
- [Respect token contract (ERC-1155)](./ordao/contracts/packages/respect1155/)
- [OREC (Optimistic Respect-based Executive Contract))](./ordao/contracts/packages/orec/)
- Deployed via Hardhat Ignition

**[Ornode](./ordao/services/ornode/):**
- Backend API server
- Indexes blockchain events
- Stores data in MongoDB
- Serves REST API

**[GUI](./ordao/apps/gui):**
- React web application
- User interface for ORDAO
- Built with Vite
- Served as static files via nginx

## orfrapps CLI

The `orfrapps` command-line tool manages all aspects of deployment:

```bash
# Available commands
orfrapps init                    # Initialize ORDAO dependencies
orfrapps contracts [targets...]  # Deploy smart contracts
orfrapps ornode [targets...]     # Configure/build ornode
orfrapps gui [targets...]        # Build web interface
orfrapps orclient-docs [...]     # Build documentation
orfrapps ornode-sync [...]       # Sync blockchain events
orfrapps rsplits [...]           # Generate respect splits
orfrapps parent-deploy [...]     # Deploy parent configs
orfrapps externalApp [...]       # Configure external apps
```

See [CLI Reference](./docs/CLI_REFERENCE.md) for details.

## Contributing

### Adding a New Fractal Configuration

1. Create `fractals/<frapp-id>/frapp.json`
2. Follow the [Configuration Walkthrough](./docs/WALKTHROUGH_CONFIGURE.md)
3. Submit a pull request
4. Request deployment in [SRT game](https://hackmd.io/@sim31/srt-1)

### Development

```bash
# Check TypeScript types
npm run check

# Run CLI locally
npm run start -- <command> [options]
```

## Support

- **Issues:** [GitHub Issues](https://github.com/sim31/frapps/issues)
- **Discussions:** [Telegram - Eden Fractal](https://t.me/edenfractal/5562)
- **ORDAO Documentation:** [ORDAO Repository](https://github.com/sim31/ordao)

## License

GPL-3.0 - See [LICENSE](./LICENSE) file for details.

## Related Projects

- **[ORDAO](https://github.com/sim31/ordao)** - On-chain Respect DAO system
- **[Fractal History](https://optimystics.io/blog/fractalhistory)** - Background on fractal organizations
