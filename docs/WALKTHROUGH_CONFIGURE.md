# Walkthrough: Configuring a New ORDAO Frapp

This guide walks you through creating configuration for a new ORDAO deployment.

## Prerequisites

- Access to this repository
- Basic understanding of your fractal organization
- Information about your respect token and governance parameters

## Steps

### 1. Choose a Frapp ID

Pick a unique identifier for your fractal:
- 2-12 characters
- Lowercase letters, numbers, and hyphens only
- Must be unique across all frapps

**Example:** `ef2`, `zaof`, `omf`

### 2. Create Frapp Directory

Create a new directory under `fractals/`:

```bash
mkdir fractals/<your-frapp-id>
```

### 3. Create `frapp.json`

Create `fractals/<your-frapp-id>/frapp.json` with the following structure:

```json
{
  "id": "<your-frapp-id>",
  "fullName": "Your Fractal Name",
  "frappsSubdomains": ["<subdomain1>", "<subdomain2>"],
  "deploymentCfg": {
    "network": "base",
    "module": "OrdaoNew",
    "oldRespectAddr": "0x...",
    "votePeriod": 777600,
    "vetoPeriod": 777600,
    "voteThreshold": 1000,
    "maxLiveYesVotes": 4,
    "ornodeOrigin": "https://<subdomain>-ornode.frapps.xyz"
  },
  "app": {
    "appId": "ordao",
    "startPeriodNum": 0,
    "parentRespectLink": "https://...",
    "childRespectLink": "https://...",
    "respectGameLink": "https://fractalgram.frapps.xyz",
    "fractalDocsUrl": "https://raw.githubusercontent.com/sim31/frapps/refs/heads/main/fractals/<your-frapp-id>/",
    "respect": {
      "award": {
        "name": "Your Fractal Respect Award",
        "description": "Respect award for contributions",
        "image": "https://..."
      },
      "fungible": {
        "name": "Your Fractal Respect",
        "description": "Respect score for contributions",
        "image": "https://...",
        "decimals": 0
      },
      "contract": {
        "name": "Your Fractal Respect",
        "symbol": "YFR",
        "description": "Awards for contributions",
        "image": "https://...",
        "banner_image": "https://...",
        "featured_image": "https://...",
        "external_link": "https://<subdomain>.frapps.xyz"
      }
    }
  }
}
```

### 4. Configure Each Field

#### Basic Information

- **`id`**: Your chosen frapp ID
- **`fullName`**: Full name of your fractal (e.g., "Eden Fractal")
- **`frappsSubdomains`**: Subdomains where your app will be accessible
  - Must be unique across all frapps
  - Will be served at `<subdomain>.frapps.xyz`
  - Can specify multiple (e.g., `["ef2", "ef", "eden"]`)

#### Network Selection (`deploymentCfg.network`)

Choose your blockchain network:
- `"base"` - Base mainnet (recommended for production)
- `"baseSepolia"` - Base testnet
- `"optimism"` - Optimism mainnet
- `"opSepolia"` - Optimism testnet

#### Governance Parameters

- **`oldRespectAddr`**: Address of your existing respect token contract
  - If you don't have one, you'll need to deploy it first
  - Must be a valid Ethereum address (0x...)

- **`votePeriod`**: Voting period in seconds
  - Example: `777600` (9 days)

- **`vetoPeriod`**: Veto period in seconds
  - Example: `777600` (9 days)

- **`voteThreshold`**: Minimum respect needed to vote
  - Example: `1000`

- **`maxLiveYesVotes`**: Maximum concurrent yes votes per user
  - Example: `4`

- **`ornodeOrigin`**: URL where your ornode backend will be hosted
  - Format: `https://<subdomain>-ornode.frapps.xyz`
  - Choose a unique subdomain

#### App Configuration

- **`startPeriodNum`**: Starting period number for your fractal
  - Use `0` for new fractals
  - Use current period number if migrating

- **`parentRespectLink`**: URL to view parent fractal's respect
  - Link to parent organization's accounts page

- **`childRespectLink`**: URL to view child respect on block explorer
  - Usually a block explorer link to your respect contract

- **`respectGameLink`**: URL to your respect game/distribution tool
  - Example: `https://fractalgram.frapps.xyz`

- **`fractalDocsUrl`**: (Optional) URL to your fractal's documentation
  - Can point to GitHub raw content or any public URL

#### Respect Token Metadata

Configure how your respect tokens appear:

**Award Metadata** (`app.respect.award`):
- Individual respect awards (NFTs)
- Include name, description, and image URL

**Fungible Token** (`app.respect.fungible`):
- Fungible respect balance
- Set `decimals` to `0` for whole numbers

**Contract Metadata** (`app.respect.contract`):
- Overall contract information
- Appears on NFT marketplaces
- Include symbol (e.g., "ERF2")

### 5. Validate Configuration

Check your configuration is valid:

```bash
# Try to read the configuration
orfrapps contracts <your-frapp-id> -c
```

If there are validation errors, they will be displayed.

### 6. Add Documentation (Optional)

Create additional documentation files in your frapp directory:

```bash
# User guide
fractals/<your-frapp-id>/userGuide.md

# Concept document
fractals/<your-frapp-id>/concept.md
```

### 7. Submit Configuration

#### Option A: Create Pull Request

1. Commit your changes:
```bash
git add fractals/<your-frapp-id>/
git commit -m "Add configuration for <your-fractal-name>"
```

2. Push to your fork and create a pull request

3. Request review from repository maintainers

#### Option B: Fill Out Form

If you're not comfortable with Git, fill out the [configuration form](https://docs.google.com/forms/d/e/1FAIpQLSdtVHemKjH78Z84PUZULZP3FxYRupt5YKQL5WSapb_sv8f1rQ/viewform).

## Next Steps

After your configuration is merged:

1. Create a contribution request in the [Synchronous Respect Tree Game](https://hackmd.io/@sim31/srt-1)
2. Reference your pull request
3. Wait for deployment by the frapps.xyz team

## Common Issues

### Invalid Frapp ID
- Must be 2-12 characters
- Only lowercase letters, numbers, and hyphens
- No spaces or special characters

### Subdomain Already Taken
- Check existing frapps in `fractals/` directory
- Choose a unique subdomain

### Invalid Ethereum Address
- Must start with `0x`
- Must be 42 characters total (0x + 40 hex characters)
- Use checksummed address format

### Missing Required Fields
- All fields marked "Required" in the configuration reference must be present
- See [CONFIGURATION.md](./CONFIGURATION.md) for complete field list

## Reference

- [Configuration Reference](./CONFIGURATION.md) - Complete field documentation
- [Example Configurations](../fractals/) - See existing frapps for examples
