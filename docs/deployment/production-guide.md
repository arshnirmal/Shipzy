# Production Deployment Guide

## Prerequisites

- DigitalOcean account
- Domain name
- SSL certificate (Let's Encrypt)

## Steps

1. **Set up Droplet**
   Run `infrastructure/digitalocean/droplet-setup.sh`

2. **Clone and Setup**
   SSH to droplet:

   ```
   git clone <repo> /home/shipzy/shipzy
   cd /home/shipzy/shipzy
   docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
   ```

3. **Configure Nginx**
   Copy `infrastructure/nginx/nginx.conf` to `/etc/nginx/nginx.conf`
   `nginx -t && systemctl reload nginx`

4. **Database Setup**
   Run migrations: `docker exec backend npm run migrate`

5. **Environment Variables**
   Set secrets in docker-compose or env files.

6. **Monitoring**
   Set up logs, alerts.

## CI/CD

GitHub Actions will deploy on main merge.
