# Managing Multiple Deployments on a Single Server

This guide explains how to run multiple ORDAO instances on one server.

## Overview

A single server can host multiple fractal deployments by:
- Using unique ports for each ornode instance
- Configuring separate nginx server blocks per subdomain
- Running multiple PM2 processes
- Using separate MongoDB databases

## Prerequisites

- Server with sufficient resources (recommend 2GB RAM per deployment)
- All prerequisites from [WALKTHROUGH_DEPLOY.md](./WALKTHROUGH_DEPLOY.md)
- Multiple frapp configurations created

## Port Allocation Strategy

Each frapp needs a unique port for its ornode backend.

**Example allocation:**
```
First frapp:  8090
Second frapp: 8091
Third frapp:  8092
...and so on
```

Configure in each `frapp.local.json`:
```json
{
  "ornode": {
    "port": 8090  // Unique per frapp
  }
}
```

## Database Organization

### Option 1: Separate Databases (Recommended)

Use one database per frapp in the same MongoDB instance:

```json
{
  "mongoCfg": {
    "url": "mongodb+srv://username:password@cluster.mongodb.net/",
    "dbName": "ef2-ordao"  // Unique per frapp
  }
}
```

### Option 2: Separate MongoDB Instances

Use completely separate MongoDB instances:

```json
{
  "mongoCfg": {
    "url": "mongodb+srv://username:password@cluster1.mongodb.net/",
    "dbName": "ordao"
  }
}
```

## Deployment operations for multiple deployments

### Deploy Contracts

Deploy contracts for all frapps at once:

```bash
# Deploy all
orfrapps contracts all -a

# Or deploy specific frapps
orfrapps contracts ef2 zaof omf -a
```

### Configure Ornodes

```bash
# Configure all
orfrapps ornode all -a --domain frapps.xyz

# Or specific frapps
orfrapps ornode ef2 zaof omf -a --domain frapps.xyz
```

### Setup Nginx

All nginx configurations are created in `sites/` directory:

```bash
# Copy all site configs
sudo cp sites/* /etc/nginx/sites-available/

# Enable all sites
for site in sites/*; do
  sitename=$(basename "$site")
  sudo ln -s /etc/nginx/sites-available/$sitename /etc/nginx/sites-enabled/
done

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Start Ornodes

```bash
# Start all ornode processes
for pm2config in proc/*/ornode.pm2.json; do
  npx pm2 start "$pm2config"
done

# Check all are running
npx pm2 status

# Save process list for automatic restart on reboot
pm2 save

# Configure PM2 to start on system boot (run once)
pm2 startup
# Follow the command output instructions
```

See [PM2 documentation](https://pm2.keymetrics.io/docs/usage/startup/) for more on process management.

### Build GUIs

```bash
# Build all
orfrapps gui all -a --domain frapps.xyz

# Or specific frapps
orfrapps gui ef2 zaof omf -a --domain frapps.xyz
```

## Monitoring

### PM2 Dashboard

Monitor all processes:

```bash
# View all processes
pm2 status

# Monitor in real-time
pm2 monit

# View logs for all
pm2 logs

# View logs for specific frapp
pm2 logs ef2-ornode
```

### Resource Monitoring

```bash
# Check memory usage
pm2 status

# Detailed process info
pm2 show ef2-ornode

# Server resources
htop
```

### Log Management

Configure log rotation in PM2:

```bash
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Maintenance

### Update All Deployments

```bash
# Pull latest code
git pull
npm run update

# Rebuild all ornodes
orfrapps ornode all -lb

# Restart all ornodes
pm2 restart all

# Rebuild all GUIs
orfrapps gui all -lb
```

### Update Specific Deployment

```bash
# Rebuild specific ornode
orfrapps ornode ef2 -lb

# Restart specific ornode
pm2 restart ef2-ornode

# Rebuild specific GUI
orfrapps gui ef2 -lb
```

## Reference

- [Deployment Walkthrough](./WALKTHROUGH_DEPLOY.md) - Single deployment guide
- [CLI Reference](./CLI_REFERENCE.md) - Command documentation
- [Configuration Reference](./CONFIGURATION.md) - Config options
