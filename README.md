# 🚚 Shipzy - Hyperlocal Delivery Platform

[![Backend CI](https://github.com/your-username/shipzy/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/your-username/shipzy/actions/workflows/backend-ci.yml)
[![User App CI](https://github.com/your-username/shipzy/actions/workflows/user-app-ci.yml/badge.svg)](https://github.com/your-username/shipzy/actions/workflows/user-app-ci.yml)
[![Driver App CI](https://github.com/your-username/shipzy/actions/workflows/driver-app-ci.yml/badge.svg)](https://github.com/your-username/shipzy/actions/workflows/driver-app-ci.yml)

> A complete hyperlocal delivery platform connecting customers with nearby couriers for instant deliveries

---

## 📋 Overview

Shipzy is a comprehensive delivery platform that enables customers to book instant deliveries and connects them with available couriers in their vicinity. The platform supports real-time tracking, secure payments, and seamless communication between all parties.

### 🏗️ Architecture

This is a **monorepo** containing:

- **Backend API** (`services/backend/`) - Node.js/Fastify REST API
- **User App** (`apps/user/`) - Flutter mobile app for customers
- **Driver App** (`apps/driver/`) - Flutter mobile app for couriers
- **Shared Types** (`packages/shared-types/`) - TypeScript definitions

### ✨ Key Features

- 📱 **Cross-Platform Mobile Apps** - Flutter apps for iOS/Android
- 🔐 **Firebase Authentication** - Secure phone number authentication
- 🚛 **Real-time Delivery Matching** - Geospatial courier assignment
- 📍 **Live Tracking** - Real-time location updates and tracking
- 💳 **Secure Payments** - Multiple payment method support
- 📊 **Analytics Dashboard** - Comprehensive metrics and reporting
- 🛡️ **Production Security** - Rate limiting, CORS, JWT tokens

---

## 🚀 Quick Start

### Prerequisites

- **Backend**: Node.js 18+, PostgreSQL 14+, Firebase project
- **Mobile Apps**: Flutter 3.0+, Android Studio/XCode
- **Development**: Docker & Docker Compose (recommended)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/shipzy.git
cd shipzy

# 2. Setup backend
cd services/backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev

# 3. Setup user app (in new terminal)
cd ../../apps/user
cp .env.example .env
# Edit .env with your configuration
flutter pub get
flutter run

# 4. Setup driver app (in new terminal)
cd ../driver
cp .env.example .env
# Edit .env with your configuration
flutter pub get
flutter run
```

> 📖 **Detailed Setup**: See individual project READMEs for comprehensive setup instructions

---

## 📁 Project Structure

```
shipzy/
├── apps/                    # Frontend Applications
│   ├── user/               # Customer Flutter App
│   │   ├── lib/           # Source code
│   │   ├── android/       # Android configuration
│   │   ├── ios/          # iOS configuration
│   │   ├── .env.example   # Environment variables
│   │   └── pubspec.yaml   # Flutter dependencies
│   └── driver/            # Courier Flutter App
│       ├── lib/          # Source code
│       ├── android/      # Android configuration
│       ├── ios/         # iOS configuration
│       ├── .env.example  # Environment variables
│       └── pubspec.yaml  # Flutter dependencies
├── services/               # Backend Services
│   └── backend/           # Node.js API Server
│       ├── src/          # Source code
│       ├── tests/        # Test suites
│       ├── scripts/      # Development scripts
│       ├── .env.example  # Environment variables
│       └── docker-compose.dev.yml
├── packages/              # Shared Packages
│   └── shared-types/      # TypeScript definitions
│       └── *.types.ts    # Type definitions
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # System design docs
│   └── deployment/       # Deployment guides
├── .github/               # CI/CD workflows
└── README.md             # This file
```

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Fastify 4.28 (high-performance web framework)
- **Database**: PostgreSQL 14+ with PostGIS
- **Authentication**: Firebase Auth + JWT
- **Testing**: Jest with Supertest
- **Deployment**: Docker + Nginx

### Mobile Apps

- **Framework**: Flutter 3.0+ (Dart)
- **State Management**: Provider/Bloc pattern
- **Networking**: Dio HTTP client
- **Maps**: Mapbox integration
- **Notifications**: Firebase Cloud Messaging

### Shared

- **Types**: TypeScript definitions
- **Linting**: ESLint (backend), Flutter analyze (apps)
- **CI/CD**: GitHub Actions

---

## 🔧 Development

### Available Scripts

```bash
# Backend development
cd services/backend
npm run dev          # Start development server
npm test            # Run test suite
npm run lint        # Lint code

# User app development
cd apps/user
flutter run         # Run on connected device
flutter build apk   # Build Android APK
flutter build ios   # Build iOS app

# Driver app development
cd apps/driver
flutter run         # Run on connected device
flutter build apk   # Build Android APK
flutter build ios   # Build iOS app
```

### Environment Setup

Each project has its own `.env.example` file. Copy these to `.env` and configure:

- **Backend**: Database credentials, Firebase config, JWT secrets
- **User App**: API endpoints, Mapbox tokens, Firebase config
- **Driver App**: API endpoints, Mapbox tokens, Firebase config

---

## 🚢 Deployment

### Production Deployment Options

1. **Docker Compose** (Recommended)

   ```bash
   cd services/backend/infrastructure/docker
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Cloud Platforms**
   - **Backend**: DigitalOcean Droplet, AWS EC2, or Vercel
   - **Mobile Apps**: Google Play Store, Apple App Store

### Infrastructure

- **Database**: PostgreSQL with PostGIS on cloud provider
- **File Storage**: Firebase Storage or AWS S3
- **CDN**: Cloudflare or AWS CloudFront
- **Monitoring**: Application logs, error tracking

> 📖 **Deployment Guide**: See [docs/deployment/production-guide.md](docs/deployment/production-guide.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with proper tests
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

### Code Quality

- Follow existing code style and patterns
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all CI checks pass

---

## 📚 Documentation

- [Backend API Documentation](services/backend/README.md)
- [User App Documentation](apps/user/README.md)
- [Driver App Documentation](apps/driver/README.md)
- [System Architecture](docs/architecture/system-design.md)
- [API Reference](docs/api/swagger.yaml)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the Shipzy development team.

**Questions?** Open an issue or reach out to the maintainers.
