# 🚀 Production Deployment Guide

> Complete guide to deploying Shipzy in production environments

---

## 📋 Deployment Overview

This guide covers deploying the Shipzy hyperlocal delivery platform to production. The system uses Docker containers orchestrated with Docker Compose, with PostgreSQL for data persistence and Nginx as a reverse proxy.

### 🏗️ Architecture

```
Internet → Nginx (SSL/TLS) → Shipzy API (Node.js/Fastify) → PostgreSQL (PostGIS)
                                       ↓
                              Firebase Auth & Cloud Messaging
```

### 📦 Components

- **API Server**: Node.js/Fastify application with 100+ test coverage
- **Database**: PostgreSQL 14+ with PostGIS for geospatial operations
- **Reverse Proxy**: Nginx with SSL termination and load balancing
- **Authentication**: Firebase Auth with JWT token management
- **Monitoring**: Health checks, structured logging, and error tracking

---

## 🛠️ Prerequisites

### Required Accounts & Services

- **Cloud Provider**: DigitalOcean, AWS EC2, or similar (2GB RAM minimum)
- **Domain Name**: Configured DNS pointing to your server
- **Firebase Project**: With Authentication and Cloud Messaging enabled
- **SSL Certificate**: Let's Encrypt (automatic) or custom certificate

### Server Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 1 vCPU minimum, 2 vCPU recommended
- **Storage**: 25GB minimum for Docker images and data
- **Network**: Public IP with ports 80, 443, 22 open

### Software Dependencies

- **Docker**: 20.10+ with Docker Compose plugin
- **Git**: For cloning the repository
- **curl/wget**: For health checks and downloads

---

## 🚀 Quick Deployment

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin

# Add user to docker group (optional)
sudo usermod -aG docker $USER

# Install Git
sudo apt install git -y

# Reboot to apply changes
sudo reboot
```

### 2. Clone Repository

```bash
# Clone the Shipzy repository
git clone https://github.com/your-username/shipzy.git
cd shipzy

# Navigate to backend directory
cd services/backend
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables**:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=shipzy_prod
DB_USER=shipzy_user
DB_PASSWORD=your_secure_db_password

# JWT Configuration
JWT_SECRET=your_256_bit_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000

# Logging
LOG_LEVEL=info
LOG_QUERIES=false
```

### 4. Database Setup

```bash
# Start PostgreSQL container first
docker run -d \
  --name postgres-setup \
  -e POSTGRES_DB=shipzy_prod \
  -e POSTGRES_USER=shipzy_user \
  -e POSTGRES_PASSWORD=your_secure_db_password \
  -v $(pwd)/src/database/init/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro \
  -v $(pwd)/docker/postgres/init-scripts/01-extensions.sql:/docker-entrypoint-initdb.d/02-extensions.sql:ro \
  -v $(pwd)/docker/postgres/init-scripts/03-load-functions.sh:/docker-entrypoint-initdb.d/03-load-functions.sh:ro \
  postgis/postgis:17-3.6-alpine

# Wait for database to initialize (check logs)
docker logs -f postgres-setup

# Stop setup container
docker stop postgres-setup
docker rm postgres-setup
```

### 5. Firebase Configuration

```bash
# Download Firebase service account key
# 1. Go to Firebase Console > Project Settings > Service Accounts
# 2. Generate new private key
# 3. Download JSON file and place in backend directory
# 4. Rename to: shipzy-prod-firebase-adminsdk.json

# Verify Firebase key exists
ls -la shipzy-prod-firebase-adminsdk.json
```

### 6. Production Docker Compose

Create `docker-compose.prod.yml` in the backend directory:

```yaml
version: "3.8"

services:
  # PostgreSQL with PostGIS
  postgres:
    image: postgis/postgis:17-3.6-alpine
    container_name: shipzy-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/database/init/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
      - ./docker/postgres/init-scripts/01-extensions.sql:/docker-entrypoint-initdb.d/02-extensions.sql:ro
      - ./docker/postgres/init-scripts/03-load-functions.sh:/docker-entrypoint-initdb.d/03-load-functions.sh:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - shipzy-network

  # Shipzy API Server
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: shipzy-api-prod
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: ${PORT}
      HOST: ${HOST}
      DB_HOST: postgres
      DB_PORT: ${DB_PORT}
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN}
      CORS_ORIGIN: ${CORS_ORIGIN}
      RATE_LIMIT_MAX: ${RATE_LIMIT_MAX}
      RATE_LIMIT_TIMEWINDOW: ${RATE_LIMIT_TIMEWINDOW}
      LOG_LEVEL: ${LOG_LEVEL}
      LOG_QUERIES: ${LOG_QUERIES}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:${PORT}/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - shipzy-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: shipzy-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - api
    networks:
      - shipzy-network

networks:
  shipzy-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  nginx_logs:
    driver: local
```

### 7. SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot -y

# Generate SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates to nginx directory
sudo mkdir -p infrastructure/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/nginx/ssl/

# Set proper permissions
sudo chmod 600 infrastructure/nginx/ssl/privkey.pem
sudo chmod 644 infrastructure/nginx/ssl/fullchain.pem
```

### 8. Nginx Configuration

Create `infrastructure/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Upstream API server
    upstream shipzy_api {
        server api:3000;
        keepalive 32;
    }

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main API server
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # API rate limiting
        limit_req zone=api burst=20 nodelay;

        # API endpoints
        location /api/ {
            proxy_pass http://shipzy_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check (no rate limiting)
        location /health {
            proxy_pass http://shipzy_api;
            access_log off;
        }

        # Block all other requests
        location / {
            return 404;
        }
    }

    # Frontend app server (if deploying web app)
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Serve static files (if applicable)
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API proxy to backend
        location /api/ {
            proxy_pass http://shipzy_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 9. Deploy Application

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Test health endpoint
curl -k https://api.yourdomain.com/health
```

---

## 🔧 Post-Deployment Configuration

### Database Migration (if needed)

```bash
# Access database container
docker exec -it shipzy-postgres-prod psql -U shipzy_user -d shipzy_prod

# Run any additional migrations or seed data
# (Your schema is auto-loaded during container initialization)
```

### Firebase Configuration

Ensure your Firebase project has:

- **Phone Authentication** enabled
- **Cloud Messaging** configured for push notifications
- **Service Account Key** properly placed in container

### Environment Variables Validation

```bash
# Check all required environment variables are set
docker exec shipzy-api-prod env | grep -E "(NODE_ENV|DB_|JWT_|CORS_|RATE_|LOG_)"
```

### SSL Certificate Renewal

```bash
# Set up automatic renewal
sudo crontab -e

# Add this line to renew certificates monthly
0 12 1 * * /usr/bin/certbot renew --quiet && docker compose -f /path/to/docker-compose.prod.yml restart nginx
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# API health check
curl -f https://api.yourdomain.com/health

# Database connectivity
docker exec shipzy-postgres-prod pg_isready -U shipzy_user -d shipzy_prod

# Container resource usage
docker stats shipzy-api-prod shipzy-postgres-prod shipzy-nginx-prod
```

### Log Management

```bash
# View application logs
docker compose -f docker-compose.prod.yml logs -f api

# View nginx access logs
docker exec shipzy-nginx-prod tail -f /var/log/nginx/access.log

# View nginx error logs
docker exec shipzy-nginx-prod tail -f /var/log/nginx/error.log
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/opt/shipzy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec shipzy-postgres-prod pg_dump -U shipzy_user -d shipzy_prod > "$BACKUP_DIR/shipzy_prod_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "shipzy_prod_*.sql" -mtime +7 -delete
```

### Performance Monitoring

```bash
# Monitor API response times
docker exec shipzy-api-prod npm run monitor

# Database query performance
docker exec shipzy-postgres-prod psql -U shipzy_user -d shipzy_prod -c "SELECT * FROM pg_stat_activity;"

# Check connection pool usage
docker exec shipzy-postgres-prod psql -U shipzy_user -d shipzy_prod -c "SELECT * FROM pg_stat_database WHERE datname = 'shipzy_prod';"
```

---

## 🚨 Troubleshooting

### Common Issues

**API Not Responding**

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check API logs
docker compose -f docker-compose.prod.yml logs api

# Test internal connectivity
docker exec shipzy-nginx-prod curl http://api:3000/health
```

**Database Connection Issues**

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test database connectivity
docker exec shipzy-api-prod nc -z postgres 5432

# Check database credentials
docker exec shipzy-api-prod env | grep DB_
```

**SSL Certificate Issues**

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Renew certificate manually
sudo certbot renew

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

**Firebase Authentication Issues**

```bash
# Verify Firebase key exists in container
docker exec shipzy-api-prod ls -la shipzy-prod-firebase-adminsdk.json

# Check Firebase configuration in logs
docker compose -f docker-compose.prod.yml logs api | grep firebase
```

### Performance Issues

**High Memory Usage**

```bash
# Check memory usage
docker stats

# Restart containers if needed
docker compose -f docker-compose.prod.yml restart

# Adjust Docker memory limits in compose file
```

**Slow API Responses**

```bash
# Check database query performance
docker exec shipzy-postgres-prod psql -U shipzy_user -d shipzy_prod -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Optimize slow queries in application logs
docker compose -f docker-compose.prod.yml logs api | grep "Query executed"
```

---

## 🔄 Updates & Scaling

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Verify deployment
curl https://api.yourdomain.com/health
```

### Horizontal Scaling

```yaml
# Add multiple API instances
services:
  api:
    # ... existing config ...
    deploy:
      replicas: 3
    networks:
      - shipzy-network

  nginx:
    # ... existing config ...
    # Load balancer will distribute requests
```

### Database Scaling

```yaml
# Add read replicas (advanced)
services:
  postgres-replica:
    image: postgis/postgis:17-3.6-alpine
    # Replication configuration...
```

---

## 🛡️ Security Checklist

- [ ] SSL/TLS certificates properly configured
- [ ] Environment variables not logged in plain text
- [ ] Database credentials secured
- [ ] Firebase service account key properly protected
- [ ] Nginx security headers configured
- [ ] Rate limiting active
- [ ] Regular security updates scheduled
- [ ] Firewall rules configured
- [ ] SSH access restricted

---

## 📞 Support & Resources

### Documentation Links

- [System Architecture](../architecture/system-design.md)
- [Backend API](../../services/backend/README.md)
- [API Reference](../api/swagger.yaml)

### Monitoring Tools

- **Prometheus**: For metrics collection
- **Grafana**: For dashboards and alerting
- **ELK Stack**: For log aggregation and analysis

### Backup & Recovery

- **Automated Backups**: Daily database dumps
- **Off-site Storage**: Cloud storage for backups
- **Recovery Testing**: Regular restore procedure validation

---

Built with ❤️ for production reliability and scalability.
