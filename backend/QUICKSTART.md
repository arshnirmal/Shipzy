# 🚀 Shipzy Backend - Quick Start Guide

> Get your Shipzy backend running in minutes with this step-by-step guide.

## 📋 Prerequisites

Before you start, make sure you have:

- **Node.js** >= 24.10.0
- **pnpm** >= 10.0.0
- **Docker** & **Docker Compose**
- **PostgreSQL** 14+ with PostGIS (if running locally)
- **Firebase** project (for authentication)

---

## 🚀 Quick Start (Docker - Recommended)

### 1. Clone Repository

```bash
cd /mnt/data/Arsh/Computer_Science/Projects/shipzy/backend
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```bash
# Server
NODE_ENV=development
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shipzy_dev
DB_USER=shipzy_user
DB_PASSWORD=your_secure_password # only needed if DATABASE_URL is empty
DB_POOL_MAX=20

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# External Services
MAPBOX_ACCESS_TOKEN=your_mapbox_token
NGROK_AUTHTOKEN=your_ngrok_token
NGROK_DOMAIN=your-domain.ngrok-free.app

# Firebase (optional if using service account key file)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 3. Start Services

```bash
# Start all services with database initialization
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker compose -f docker-compose.dev.yml logs -f backend
```

### 4. Verify Setup

```bash
# Check health endpoint
curl http://localhost:3000/health

# Test API documentation
curl http://localhost:3000/docs
```

🎉 **That's it!** Your backend is now running at `http://localhost:3000`

---

## 💻 Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

```bash
# Start PostgreSQL with Docker
docker compose -f docker-compose.dev.yml up -d postgres

# Wait for database to be ready
docker compose -f docker-compose.dev.yml logs -f postgres
```

### 3. Deploy Database Schema

```bash
# Generate migrations (if schema changed)
pnpm run db:generate

# Deploy migrations
pnpm run db:deploy

# Seed development data (optional)
pnpm run db:seed
```

### 4. Start Development Server

```bash
pnpm run dev
```

Your server is now running at `http://localhost:3000` with hot reload enabled.

---

## 🔧 Database Operations

### Generate Migrations

```bash
# After changing schema files in src/database/schema/
pnpm run db:generate
```

### Deploy Migrations

```bash
# Apply pending migrations to database
pnpm run db:deploy
```

### Reset Database

```bash
# ⚠️ This will delete all data!
pnpm run db:reset
```

### Seed Development Data

```bash
# Add sample data for development
pnpm run db:seed
```

---

## 🧪 Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm run test:watch
```

### Test Specific Modules

```bash
pnpm run test:auth      # Authentication tests
pnpm run test:users     # User management tests
pnpm run test:orders    # Order management tests
pnpm run test:static    # Static data tests
```

---

## 📡 API Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Get Static Data (No Auth Required)

```bash
curl http://localhost:3000/api/v1/static/delivery-types
```

### Authentication Example

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "client"
  }'
```

---

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL container status
docker compose -f docker-compose.dev.yml ps postgres

# Check database logs
docker compose -f docker-compose.dev.yml logs postgres

# Test database connection
docker compose -f docker-compose.dev.yml exec postgres psql -U shipzy_user -d shipzy_dev -c "SELECT NOW();"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Migration Issues

```bash
# Check migration status
pnpm run db:deploy

# Force reset (dangerous)
pnpm run db:reset
```

### Environment Variable Issues

```bash
# Verify required variables are set
grep -E "(JWT_SECRET|MAPBOX_ACCESS_TOKEN|DB_PASSWORD)" .env
```

---

## 📚 Next Steps

1. **Explore API Documentation**: Visit `http://localhost:3000/docs`
2. **Review Complete API Guide**: See `docs/complete-api-testing.md`
3. **Set Up Frontend**: Connect your Flutter/Web frontend
4. **Configure Firebase**: Set up Firebase authentication
5. **Deploy to Production**: See production deployment guide

---

## 🆘 Need Help?

- **Issues**: Create an issue on GitHub
- **Documentation**: Check `docs/` folder
- **API Reference**: Visit `/docs` endpoint when server is running

---

**🎯 Happy coding!** Your Shipzy backend is ready for development.
