# Walkthrough: Deploying ORDAO

This guide walks you through deploying ORDAO for your fractal on your own server.

## Prerequisites

### Infrastructure
- **Linux server** with root/sudo access
- **Nginx** web server installed and configured
- **Node.js** 18+ and npm
- **MongoDB** instance (recommend [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Domain name** with DNS access

### Accounts & Services
- **Privy App ID** - Create at [privy.io](https://privy.io)
- **RPC Provider** - Alchemy, Infura, or similar
- **Blockchain wallet** with funds for contract deployment

### Configuration
- **Frapp configuration** (`frapp.json`) created
  - See [WALKTHROUGH_CONFIGURE.md](./WALKTHROUGH_CONFIGURE.md)

## Deployment Steps

### 1. Clone and Initialize Repository

```bash
# Clone the repository
git clone https://github.com/sim31/frapps.git
cd frapps

# Initialize submodules and dependencies
npm run init

# Source the CLI alias
source ./orfrapps-alias
```

**What this does:**
- Clones the frapps repository to your local filesystem
- Initializes the ORDAO submodule
- Installs all npm dependencies
- Builds ORDAO components
- Creates the `orfrapps` command alias (so you can use `orfrapps ...` commands in your terminal)

### 2. Create Local Configuration

Create `fractals/<your-frapp-id>/frapp.local.json`:

```json
{
  "providerUrl": "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
  "privyAppId": "your-privy-app-id",
  "mongoCfg": {
    "url": "mongodb+srv://username:password@cluster.mongodb.net/",
    "dbName": "<your-frapp-id>-ordao"
  },
  "ornode": {
    "host": "localhost",
    "port": 8090,
    "startPeriodNum": 0,
  }
}
```

**Configuration notes:**

- **`providerUrl`**: Your RPC endpoint URL
  - Get from Alchemy, Infura, or public RPC
  - Must match network in `frapp.json`

- **`privyAppId`**: Your Privy application ID
  - Create app at [dashboard.privy.io](https://dashboard.privy.io)
  - Configure allowed domains

- **`mongoCfg.url`**: MongoDB connection string
  - Recommend MongoDB Atlas free tier
  - Ensure IP whitelist includes your server

- **`mongoCfg.dbName`**: Database name
  - Use format: `<frapp-id>-ordao`

- **`ornode.port`**: Backend API port
  - Each frapp needs unique port
  - Default: 8090, increment for multiple frapps (8091, 8092, etc.)

### 3. Configure Contract Deployment

Create `.env` file in `contracts/` directory:

```bash
cd contracts
cp .env.example .env
```

Edit `.env` and add:

```env
# For Base mainnet
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_PRIVATE_KEY=your_private_key_here

# For Base Sepolia testnet
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_SEPOLIA_PRIVATE_KEY=your_private_key_here
```

**Security warning:** Never commit `.env` file or share private keys!

### 4. Deploy Smart Contracts

```bash
# From repository root
orfrapps contracts <your-frapp-id> -a
```

**What this does:**
1. Builds contracts
2. Generates deployment parameters for Hardhat ignition (configuration)
3. Deploys contracts via Hardhat Ignition
4. Verifies contracts on block explorer
5. Outputs deployment addresses to `dist/deployments/<frapp-id>.json`

**Expected output:**
```
Wrote ignition config: contracts/ignition/<frapp-id>.json
Deploying contracts...
Wrote deployment info: dist/deployments/<frapp-id>.json
```

**Time estimate:** 1-5 minutes

### 5. Configure and Build Ornode

```bash
orfrapps ornode <your-frapp-id> -a --domain <your-domain>
```

Replace `<your-domain>` with your domain (e.g., `frapps.xyz` or `yourdomain.com`).

**What this does:**
1. Cleans previous builds
2. Builds ornode
3. Generates ornode runtime configuration
4. Creates nginx site configuration
5. Creates PM2 process configuration

**Output files:**
- `proc/<frapp-id>/ornode.json` - Ornode runtime config
- `proc/<frapp-id>/ornode.pm2.json` - PM2 config
- `sites/<subdomain>-ornode.<domain>` - Nginx config

### 6. Configure Nginx

Copy nginx configuration to nginx sites directory:

```bash
sudo cp sites/* /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/<subdomain>-ornode.<domain> /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/<subdomain>.<domain> /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo nginx -s reload
```

### 7. Configure DNS

Add DNS records for your subdomains:

```
Type: A
Name: <subdomain>
Value: <your-server-ip>

Type: A
Name: <subdomain>-ornode
Value: <your-server-ip>
```

Wait for DNS propagation (can take up to 48 hours, usually minutes).

### 8. Setup SSL Certificates

One way is to use Let's Encrypt for free SSL certificates:

```bash
sudo certbot --nginx -d <subdomain>.<domain> -d <subdomain>-ornode.<domain>
```

Follow the prompts to configure HTTPS.

### 9. Start Ornode

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start ornode
npx pm2 start proc/<your-frapp-id>/ornode.pm2.json

# Check status
npx pm2 status

# View logs
npx pm2 logs <your-frapp-id>-ornode
```

**Verify ornode is running:**
```bash
curl http://localhost:<port>/health
```

### 10. Build and Deploy GUI

```bash
orfrapps gui <your-frapp-id> -a --domain <your-domain>
```

**What this does:**
1. Cleans previous builds
2. Generates GUI environment configuration
3. Builds React application
4. Creates nginx site configuration

**Output:**
- GUI build in `ordao/apps/gui/builds/<frapp-id>/`
- Nginx config in `sites/<subdomain>.<domain>`

### 11. Verify Deployment

Visit your deployment:

1. **Frontend:** `https://<subdomain>.<domain>`
2. **Backend API:** `https://<subdomain>-ornode.<domain>`

**Check:**
- [ ] Frontend loads without errors
- [ ] Can connect wallet via Privy
- [ ] Can view proposals and accounts
- [ ] Backend API responds to requests

## Post-Deployment

### Configure PM2 Startup

Ensure ornode restarts on server reboot:

```bash
# Configure PM2 to start on system boot
pm2 startup
# Follow the command output instructions (may require sudo)

# Save current PM2 process list
pm2 save
```

**To restore processes after reboot:**
```bash
pm2 resurrect
```

The `pm2 save` command saves your current process list, and `pm2 resurrect` restores it. This is useful when:
- Server reboots (automatic with `pm2 startup`)
- You need to restore processes after PM2 updates
- You want to replicate process configuration on another server

See [PM2 documentation](https://pm2.keymetrics.io/docs/usage/startup/) for more details on process management and startup configuration.

### Monitor Logs

```bash
# View all logs
pm2 logs

# View specific frapp logs
pm2 logs <frapp-id>-ornode

# Monitor in real-time
pm2 monit
```

### Backup Database

Set up regular MongoDB backups:

```bash
# Set environment variables
export BACKUP_DIR=/path/to/backups
export MONGO_DUMP_URI="mongodb+srv://..."

# Run backup
orfrapps ornode <frapp-id> -d
```

Consider setting up a cron job for automated backups.

## Troubleshooting

### Ornode Won't Start

**Check logs:**
```bash
pm2 logs <frapp-id>-ornode --lines 100
```

**Common issues:**
- MongoDB connection failed - check connection string
- Port already in use - change port in `frapp.local.json`
- Missing environment variables - verify `frapp.local.json`

### Frontend Shows Errors

**Check browser console** for specific errors.

**Common issues:**
- Can't connect to ornode - verify nginx configuration and SSL
- Privy authentication fails - check Privy app configuration
- Wrong contract addresses - verify deployment info

### Contract Deployment Failed

**Check:**
- Sufficient funds in deployment wallet
- Correct RPC URL for network
- Private key has proper format (no 0x prefix in .env)

**Retry deployment:**
```bash
orfrapps contracts <frapp-id> -d --reset
```

### Nginx 502 Bad Gateway

**Causes:**
- Ornode not running - check `pm2 status`
- Wrong port in nginx config - verify matches `frapp.local.json`
- Firewall blocking port - check server firewall rules

## Updating Deployment

### Update Code

```bash
# Pull latest changes
git pull

# Update submodules
npm run update

# Rebuild ornode
orfrapps ornode <frapp-id> -lb

# Restart ornode
pm2 restart <frapp-id>-ornode

# Rebuild GUI
orfrapps gui <frapp-id> -lb
```

### Update Configuration

After changing `frapp.json` or `frapp.local.json`:

```bash
# Reconfigure ornode
orfrapps ornode <frapp-id> -c

# Restart ornode
pm2 restart <frapp-id>-ornode

# Reconfigure and rebuild GUI
orfrapps gui <frapp-id> -a
```

## Reference

- [CLI Reference](./CLI_REFERENCE.md) - Complete command documentation
- [Configuration Reference](./CONFIGURATION.md) - All config options
- [Managing Multiple Deployments](./MULTIPLE_DEPLOYMENTS.md) - Multi-frapp setup
