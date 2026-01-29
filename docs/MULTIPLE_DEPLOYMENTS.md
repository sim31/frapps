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

**Recommended allocation:**
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

**Advantages:**
- Clear separation
- Easy to backup individually
- Independent scaling

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

**Advantages:**
- Complete isolation
- Can use different providers
- Better for high-traffic deployments

## Deployment Workflow

### 1. Deploy All Contracts

Deploy contracts for all frapps at once:

```bash
# Deploy all
orfrapps contracts all -a

# Or deploy specific frapps
orfrapps contracts ef2 zaof omf -a
```

### 2. Configure All Ornodes

```bash
# Configure all
orfrapps ornode all -a --domain frapps.xyz

# Or specific frapps
orfrapps ornode ef2 zaof omf -a --domain frapps.xyz
```

### 3. Setup Nginx

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

### 4. Configure DNS

Add DNS records for all subdomains:

```
# For frapp with subdomains ["ef2", "ef"]
ef2.frapps.xyz        -> server IP
ef.frapps.xyz         -> server IP
ef2-ornode.frapps.xyz -> server IP

# For frapp with subdomain ["zaof"]
zaof.frapps.xyz        -> server IP
zaof-ornode.frapps.xyz -> server IP
```

### 5. Setup SSL for All Domains

```bash
# Get certificates for all domains at once
sudo certbot --nginx \
  -d ef2.frapps.xyz \
  -d ef.frapps.xyz \
  -d ef2-ornode.frapps.xyz \
  -d zaof.frapps.xyz \
  -d zaof-ornode.frapps.xyz
```

### 6. Start All Ornodes

```bash
# Start all ornode processes
for pm2config in proc/*/ornode.pm2.json; do
  npx pm2 start "$pm2config"
done

# Check all are running
npx pm2 status
```

### 7. Build All GUIs

```bash
# Build all
orfrapps gui all -a --domain frapps.xyz

# Or specific frapps
orfrapps gui ef2 zaof omf -a --domain frapps.xyz
```

## Resource Management

### Memory Considerations

Each deployment consumes:
- **Ornode:** ~200-500MB RAM
- **GUI:** Static files (negligible when served)
- **MongoDB:** Varies by data size

**Recommendations:**
- 2GB RAM: 1-2 deployments
- 4GB RAM: 3-5 deployments
- 8GB RAM: 6-10 deployments

### Disk Space

Each deployment requires:
- **Contracts:** ~50MB
- **Ornode build:** ~200MB (shared)
- **GUI build:** ~10-20MB per frapp
- **Database:** Varies (plan for 100MB-1GB per frapp)

### CPU Usage

- Contract deployment: High CPU during deployment only
- Ornode: Low CPU during normal operation
- GUI: Static files (no CPU)

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

### Backup All Databases

Create backup script `backup-all.sh`:

```bash
#!/bin/bash
export BACKUP_DIR=/path/to/backups

# Backup each frapp
for frapp in ef2 zaof omf; do
  echo "Backing up $frapp..."
  orfrapps ornode $frapp -d
done

echo "All backups complete"
```

Run via cron:
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-all.sh
```

## Troubleshooting

### Port Conflicts

**Symptom:** Ornode fails to start with "port already in use"

**Solution:**
1. Check which process is using the port:
   ```bash
   sudo lsof -i :8090
   ```
2. Update `frapp.local.json` with unique port
3. Reconfigure and restart:
   ```bash
   orfrapps ornode <frapp-id> -cp
   pm2 restart <frapp-id>-ornode
   ```

### Memory Issues

**Symptom:** Server becomes slow or processes crash

**Solution:**
1. Check memory usage:
   ```bash
   free -h
   pm2 status
   ```
2. Restart high-memory processes:
   ```bash
   pm2 restart <process-name>
   ```
3. Consider upgrading server or reducing deployments

### Nginx Configuration Conflicts

**Symptom:** Nginx fails to reload or sites don't work

**Solution:**
1. Test nginx configuration:
   ```bash
   sudo nginx -t
   ```
2. Check for duplicate server_name directives
3. Ensure each subdomain is unique across all frapps
4. Verify SSL certificates cover all domains

### Database Connection Issues

**Symptom:** Ornode can't connect to MongoDB

**Solution:**
1. Verify MongoDB connection string in `frapp.local.json`
2. Check IP whitelist in MongoDB Atlas
3. Test connection:
   ```bash
   mongosh "mongodb+srv://..."
   ```
4. Ensure database names are unique per frapp

## Best Practices

### Naming Conventions

- **Frapp IDs:** Short, memorable (e.g., `ef2`, `zaof`)
- **Subdomains:** Match frapp ID or common abbreviation
- **Database names:** `<frapp-id>-ordao` format
- **PM2 process names:** `<frapp-id>-ornode` (auto-generated)

### Security

- Use separate MongoDB users per frapp (optional but recommended)
- Keep `frapp.local.json` files secure (never commit)
- Regularly update SSL certificates (certbot auto-renews)
- Monitor PM2 logs for suspicious activity

### Performance

- Use CDN for static assets if serving many users
- Enable gzip compression in nginx
- Configure MongoDB indexes properly
- Monitor and optimize slow queries

### Backup Strategy

- Daily automated backups
- Store backups off-server
- Test restore process regularly
- Keep at least 7 days of backups

## Scaling Considerations

### When to Split Servers

Consider separate servers when:
- Total memory usage exceeds 80% regularly
- CPU usage is consistently high
- Network bandwidth is saturated
- You need geographic distribution

### Load Balancing

For high-traffic deployments:
- Use multiple ornode instances per frapp
- Configure nginx load balancing
- Use MongoDB replica sets
- Consider managed services (MongoDB Atlas, etc.)

## Reference

- [Deployment Walkthrough](./WALKTHROUGH_DEPLOY.md) - Single deployment guide
- [CLI Reference](./CLI_REFERENCE.md) - Command documentation
- [Configuration Reference](./CONFIGURATION.md) - Config options
