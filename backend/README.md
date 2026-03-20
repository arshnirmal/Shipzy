# 🚚 Shipzy Backend

> Production-ready backend API for the Shipzy hyperlocal delivery platform

[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-blue.svg)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange.svg)](https://firebase.google.com/)

---

## 📋 Overview

Shipzy Backend is a high-performance REST API built with Fastify, multi-provider authentication (Firebase, Google OAuth, Email/Password), and PostgreSQL with Drizzle ORM. It powers a hyperlocal delivery platform connecting customers with nearby couriers.

### Key Features

- ✅ **Multi-Authentication** (Firebase Phone OTP, Google OAuth, Email/Password)
- ✅ **JWT Token Management** with refresh tokens
- ✅ **Role-Based Access Control** (Client, Courier, Admin)
- ✅ **PostgreSQL Database** with PostGIS for geospatial queries
- ✅ **Real-time Tracking** (WebSocket support ready)
- ✅ **Secure & Scalable** architecture
- ✅ **Comprehensive Error Handling**
- ✅ **Rate Limiting** & Security Headers
- ✅ **Structured Logging** with Pino

---

## �️ Development Setup

### Prerequisites

- Node.js >= 24.10.0
- PostgreSQL 14+ with PostGIS
- Docker & Docker Compose
- Firebase project
- pnpm >= 10.0.0

### Local Development Setup

```bash
# 1. Clone and navigate
cd /mnt/data/Arsh/Computer_Science/Projects/shipzy/backend

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start PostgreSQL (if not using Docker)
docker compose -f docker-compose.dev.yml up -d postgres

# 5. Deploy database migrations
pnpm run db:deploy

# 6. Start development server
pnpm run dev
```

### Docker Development Setup

```bash
# 1. Configure environment
cp .env.example .env

# 2. Start all services
docker compose -f docker-compose.dev.yml up -d --build

# 3. Check logs
docker compose -f docker-compose.dev.yml logs -f backend
```

## 🔐 Firebase Auth Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable Authentication
4. Enable Google OAuth and Email/Password providers

### 2. Get Service Account Key

1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download JSON file and save as `shipzy-firebase-service-account.json`
4. Place file in backend root directory

### 3. Configure Environment

```bash
# Add to .env file
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 4. Test Firebase Connection

```bash
# Test Firebase admin initialization
node -e "console.log(require('firebase-admin').apps.length > 0 ? 'Firebase initialized' : 'Firebase not initialized')"
```

**👉 See [Development Setup](#development-setup) for detailed setup**

**👉 See [Firebase Auth Setup](#firebase-auth-setup) for Firebase configuration**

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/                 # Configuration
│   │   ├── env.ts             # Environment variables
│   │   ├── firebase.ts        # Firebase Admin SDK
│   │   └── logger.ts          # Pino logger
│   │
│   ├── utils/                  # Utilities
│   │   ├── jwt.util.ts        # JWT generation/verification
│   │   ├── response.util.ts   # Standard responses
│   │   └── error.util.ts      # Custom error classes
│   │
│   ├── middleware/             # Middleware
│   │   ├── auth.middleware.ts # JWT authentication
│   │   ├── error.middleware.ts# Global error handler
│   │   └── validate.middleware.ts # Request validation
│   │
│   ├── database/               # Database
│   │   ├── db.ts              # Connection pool
│   │   ├── drizzle.ts         # Drizzle ORM instance
│   │   ├── transaction.ts     # Transaction helper
│   │   ├── schema/            # Drizzle schema definitions
│   │   ├── migrations/        # SQL migrations (auto-generated)
│   │   ├── functions/         # SQL stored functions
│   │   ├── queries/           # Raw SQL queries
│   │   └── utils/             # Database utilities
│   │
│   ├── modules/                # Feature modules
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── drivers/           # Driver management
│   │   ├── orders/            # Order management
│   │   ├── addresses/         # Address & location services
│   │   ├── ratings/           # Rating system
│   │   ├── static/            # Static data
│   │   └── pricing/           # Pricing calculations
│   │
│   ├── schemas/                # Zod validation schemas
│   ├── types/                  # TypeScript type definitions
│   ├── app.ts                  # Fastify app
│   └── server.ts               # Server entry point
│
├── scripts/                    # Database & utility scripts
├── tests/                      # Test files
├── docs/                       # Documentation
├── package.json
├── .env.example
└── README.md
```

---

## 🛠️ Tech Stack

| Category           | Technology                                          |
| ------------------ | --------------------------------------------------- |
| **Runtime**        | Node.js 24+                                         |
| **Framework**      | Fastify 5.7+                                        |
| **Database**       | PostgreSQL 14+ with PostGIS + Drizzle ORM           |
| **Authentication** | Firebase Auth + Google OAuth + Email/Password + JWT |
| **Package Manager** | pnpm 10.0+                                         |
| **Language**       | TypeScript 5.7+                                     |
| **Logger**         | Pino                                                |
| **Validation**     | Zod + AJV                                           |
| **Security**       | Helmet, CORS, Rate Limiting                         |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint                       | Description                     | Auth Required |
| ------ | ------------------------------ | ------------------------------- | ------------- |
| POST   | `/api/v1/auth/firebase/verify` | Login/Register with phone (OTP) | No            |
| POST   | `/api/v1/auth/google/verify`   | Login/Register with Google      | No            |
| POST   | `/api/v1/auth/register`        | User registration (email)       | No            |
| POST   | `/api/v1/auth/login`           | User login (email)              | No            |
| POST   | `/api/v1/auth/refresh`         | Refresh JWT token               | No            |
| POST   | `/api/v1/auth/logout`          | Logout (revoke token)           | Yes           |

### User Management

| Method | Endpoint                         | Description              | Auth Required |
| ------ | -------------------------------- | ------------------------ | ------------- |
| GET    | `/api/v1/users/me`               | Get current user profile | Yes           |
| PUT    | `/api/v1/users/me`               | Update user profile      | Yes           |
| GET    | `/api/v1/users/me/addresses`     | Get saved addresses      | Yes           |
| POST   | `/api/v1/users/me/addresses`     | Save new address         | Yes           |
| DELETE | `/api/v1/users/me/addresses/:id` | Delete saved address     | Yes           |

### Driver Management

| Method | Endpoint                          | Description             | Auth Required |
| ------ | --------------------------------- | ----------------------- | ------------- |
| GET    | `/api/v1/drivers/me`              | Get driver profile      | Yes (Courier) |
| PUT    | `/api/v1/drivers/me`              | Update driver profile   | Yes (Courier) |
| PUT    | `/api/v1/drivers/me/availability` | Toggle availability     | Yes (Courier) |
| PUT    | `/api/v1/drivers/me/location`     | Update current location | Yes (Courier) |
| GET    | `/api/v1/drivers/me/assignments`  | Get active assignments  | Yes (Courier) |
| GET    | `/api/v1/drivers/me/earnings`     | Get earnings summary    | Yes (Courier) |

### Order Management

| Method | Endpoint                        | Description             | Auth Required |
| ------ | ------------------------------- | ----------------------- | ------------- |
| POST   | `/api/v1/orders/calculate-fare` | Calculate fare estimate | Yes           |
| POST   | `/api/v1/orders`                | Create new order        | Yes (Client)  |
| GET    | `/api/v1/orders`                | List user's orders      | Yes (Client)  |
| GET    | `/api/v1/orders/available`      | List available orders   | Yes (Courier) |
| GET    | `/api/v1/orders/:id`            | Get order details       | Yes           |
| POST   | `/api/v1/orders/:id/cancel`     | Cancel order            | Yes           |
| POST   | `/api/v1/orders/:id/accept`     | Driver accepts order    | Yes (Courier) |
| PUT    | `/api/v1/orders/:id/status`     | Update order status     | Yes (Courier) |

### Address & Location

| Method | Endpoint                            | Description                            | Auth Required |
| ------ | ----------------------------------- | -------------------------------------- | ------------- |
| POST   | `/api/v1/addresses/search`          | Search places (step 1)                 | Yes           |
| POST   | `/api/v1/addresses/retrieve`        | Get place details (step 2)             | Yes           |
| POST   | `/api/v1/addresses/reverse-geocode` | Reverse geocode coordinates            | Yes           |
| POST   | `/api/v1/addresses/directions`      | Get directions between points          | Yes           |
| POST   | `/api/v1/addresses/distance`        | Calculate distance between coordinates | Yes           |

### Static Data

| Method | Endpoint                            | Description            | Auth Required |
| ------ | ----------------------------------- | ---------------------- | ------------- |
| GET    | `/api/v1/static/delivery-types`     | Get delivery types     | No            |
| GET    | `/api/v1/static/weight-tiers`       | Get weight tiers       | No            |
| GET    | `/api/v1/static/vehicle-categories` | Get vehicle categories | No            |
| GET    | `/api/v1/static/package-types`      | Get package types      | No            |
| GET    | `/api/v1/static/payment-methods`    | Get payment methods    | No            |
| GET    | `/api/v1/static/create-order-data`  | Get create order data  | No            |
| GET    | `/api/v1/static/order-statuses`     | Get order statuses     | No            |

### Health Check

| Method | Endpoint  | Description          | Auth Required |
| ------ | --------- | -------------------- | ------------- |
| GET    | `/health` | Server health status | No            |
| GET    | `/api/v1` | API info             | No            |

**📋 Total: 38 implemented endpoints**

---

## 🔐 Authentication Flow

The backend supports multiple authentication methods:

1. **Firebase Phone Authentication** (OTP-based)
2. **Google OAuth Authentication**
3. **Email/Password Registration & Login**

The flow below shows the Firebase phone authentication process:

```mermaid
sequenceDiagram
    participant App as Flutter App
    participant FB as Firebase Auth
    participant API as Backend API
    participant DB as PostgreSQL

    App->>FB: Send OTP to phone
    FB->>App: OTP sent
    App->>FB: Verify OTP
    FB->>App: ID Token
    App->>API: POST /auth/firebase/verify (idToken)
    API->>FB: Verify ID token
    FB->>API: Token valid, user info
    API->>DB: Create/Find user
    DB->>API: User data
    API->>DB: Store JWT session
    API->>App: JWT access + refresh tokens
    App->>API: Subsequent requests with JWT
    API->>DB: Validate JWT
    API->>App: Protected resource
```

---

## 🔧 Environment Variables

| Variable                | Description                    | Default                      |
|-------------------------|--------------------------------|------------------------------|
| `NODE_ENV`               | Environment                    | `development`                |
| `BACKEND_PORT`           | Server port                    | `3000`                       |
| `BACKEND_HOST`           | Server host                    | `0.0.0.0`                    |
| `DB_HOST`                | Database host                  | `localhost`                  |
| `DB_PORT`                | Database port                  | `5432`                       |
| `DB_NAME`                | Database name                  | `shipzy_dev`                 |
| `DB_USER`                | Database user                  | `shipzy_user`                |
| `DB_PASSWORD`            | Database password              | `secure_password`            |
| `DB_POOL_MAX`            | Database connection pool size  | `20`                         |
| `JWT_SECRET`             | JWT signing key                | (generate with openssl)      |
| `JWT_EXPIRES_IN`         | JWT expiration time            | `7d`                         |
| `JWT_REFRESH_EXPIRES_IN` | JWT refresh token expiration   | `30d`                        |
| `CORS_ORIGIN`            | CORS allowed origins           | `http://localhost:3000`      |
| `RATE_LIMIT_MAX`         | Rate limiting max requests     | `100`                        |
| `RATE_LIMIT_TIMEWINDOW`  | Rate limiting time window (ms) | `60000`                      |
| `LOG_LEVEL`              | Logging level                  | `info`                       |
| `LOG_QUERIES`            | Enable query logging           | `true`                       |
| `NGROK_AUTHTOKEN`        | ngrok auth token               | From ngrok dashboard         |
| `NGROK_DOMAIN`           | ngrok domain                   | `your-domain.ngrok-free.app` |

**Note:** Firebase authentication is now handled via the service account key file (`shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json`) rather than environment variables.

**See [.env.example](./.env.example) for complete list**

---

## 🧪 Testing

Shipzy Backend includes comprehensive test coverage with 100+ test cases covering all API endpoints, authentication, authorization, and database operations.

### Available Test Scripts

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run comprehensive test suite
npm run test:all

# Run specific test modules
npm run test:auth        # Authentication tests
npm run test:users       # User management tests
npm run test:drivers     # Driver management tests
npm run test:orders      # Order management tests
npm run test:static      # Static data tests
npm run test:system      # Health check & system tests

# Generate detailed coverage report
npm run test:coverage

# Setup/cleanup test database
npm run test:db:setup
npm run test:db:cleanup

# Lint and format test files
npm run lint:test
npm run format:test
```

### Test Coverage

- ✅ **Authentication & Authorization** (Firebase, JWT, Role-based access)
- ✅ **User Management** (Profiles, addresses, validation)
- ✅ **Driver Management** (Availability, location, earnings, assignments)
- ✅ **Order Management** (Creation, status updates, cancellation, acceptance)
- ✅ **Static Data** (Delivery types, vehicle categories, payment methods)
- ✅ **System Health** (Health checks, error handling, performance)
- ✅ **Integration Tests** (Complete user workflows, concurrent operations)
- ✅ **Database Integration** (Test database setup, cleanup, validation)

### Test Features

- 🗄️ **Isolated Test Database** - Automatic setup and cleanup
- 🔐 **Real Authentication** - Full Firebase and JWT token testing
- 🚛 **Role-based Testing** - Client and courier workflow validation
- 📊 **Performance Testing** - Concurrent request and load testing
- 🛡️ **Security Testing** - Authentication and authorization edge cases
- 🔄 **Integration Testing** - Complete order lifecycle workflows

**See [tests/README.md](./tests/README.md) for detailed testing documentation**

## 🛠️ Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Database operations
pnpm run db:generate    # Generate migrations from schema
pnpm run db:deploy      # Deploy migrations to database
pnpm run db:reset       # Reset database (dangerous)
pnpm run db:seed        # Seed development data
```

---

## 🚢 Production Deployment

### Option 1: Docker

```bash
docker compose -f docker compose.yml up -d
```

### Option 2: PM2

```bash
npm install -g pm2
pm2 start src/server.js --name shipzy-backend
pm2 startup
pm2 save
```

### Option 3: Systemd

```bash
sudo systemctl start shipzy-backend
sudo systemctl enable shipzy-backend
```

**See [production-guide.md](../../docs/deployment/production-guide.md) for details**

---

## 🔒 Security Best Practices

- ✅ Environment variables for secrets
- ✅ JWT with short expiration (7 days)
- ✅ Refresh tokens for long sessions
- ✅ Rate limiting (100 req/min by default)
- ✅ CORS configured
- ✅ Helmet security headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ Token revocation on logout
- ✅ HTTPS only in production

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U shipzy_user -d shipzy_dev -c "SELECT NOW();"
```

### Firebase Auth Issues

The backend now uses a Firebase service account key file (`shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json`) instead of environment variables for Firebase authentication.

To verify Firebase setup:

```bash
# Check if service account key file exists
ls -la shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json

# Verify Firebase Admin SDK can initialize
node -e "console.log(require('firebase-admin').apps.length > 0 ? 'Firebase initialized' : 'Firebase not initialized')"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📚 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Firebase Auth Setup](./FIREBASE_AUTH_SETUP.md)
- [Database Schema](./src/database/schemas/)
- [API Documentation](../../docs/api/swagger.yaml) (coming soon)
- [Architecture](../../docs/architecture/system-design.md)

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push: `git push origin feature/your-feature`
4. Create Pull Request

---

## 📄 License

See [LICENSE](../../LICENSE)

---

## 📞 Support

- **Issues**: Create an issue on GitHub
- **Email**: support@shipzy.com
- **Docs**: See documentation links above

---

**Built with ❤️ by the Shipzy Team**
