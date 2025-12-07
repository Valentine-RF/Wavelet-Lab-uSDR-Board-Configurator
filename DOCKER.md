# Docker Deployment Guide

This guide explains how to deploy the uSDR Development Board Dashboard using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator.git
cd Wavelet-Lab-uSDR-Board-Configurator
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret key for JWT token signing (generate a strong random string)
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `MYSQL_PASSWORD` - MySQL user password

### 3. Start the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec app pnpm db:push
```

### 5. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Access Application Shell
```bash
docker-compose exec app sh
```

### Access Database Shell
```bash
docker-compose exec db mysql -u usdr -p usdr_dashboard
```

## Production Deployment

### 1. Update Environment Variables

Set production values in `.env`:
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DATABASE_URL=mysql://user:password@db:3306/usdr_dashboard
```

### 2. Enable HTTPS

Use a reverse proxy (nginx or Traefik) in front of the Docker container:

**nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name usdr.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Configure Backups

**Database backups:**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db mysqldump -u usdr -p$MYSQL_PASSWORD usdr_dashboard > backup_$DATE.sql
gzip backup_$DATE.sql
EOF

chmod +x backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 4. Monitor Health

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect usdr-dashboard | grep -A 10 Health
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec app ping db
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
# From: "3000:3000"
# To:   "8080:3000"
```

### Out of Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove old images
docker image prune -a
```

## Performance Optimization

### Increase Memory Limit

Add to `docker-compose.yml` under `app` service:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

### Enable Caching

Add Redis for session caching:
```yaml
redis:
  image: redis:7-alpine
  container_name: usdr-redis
  ports:
    - "6379:6379"
  networks:
    - usdr-network
```

## Security Best Practices

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET** (at least 32 random characters)
3. **Enable firewall** and only expose necessary ports
4. **Regular updates**: `docker-compose pull && docker-compose up -d`
5. **Monitor logs** for suspicious activity
6. **Backup regularly** (database and configuration)

## Support

For issues or questions:
- GitHub Issues: https://github.com/Valentine-RF/Wavelet-Lab-uSDR-Board-Configurator/issues
- Documentation: See main README.md
- Manus Help: https://help.manus.im
