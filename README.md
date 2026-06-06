# 🚚 Shipzy - Hyperlocal Delivery Platform

[![Backend CI](https://github.com/arshnirmal/shipzy/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/arshnirmal/shipzy/actions/workflows/backend-ci.yml)
[![User App CI](https://github.com/arshnirmal/shipzy/actions/workflows/user-app-ci.yml/badge.svg)](https://github.com/arshnirmal/shipzy/actions/workflows/user-app-ci.yml)
[![Driver App CI](https://github.com/arshnirmal/shipzy/actions/workflows/driver-app-ci.yml/badge.svg)](https://github.com/arshnirmal/shipzy/actions/workflows/driver-app-ci.yml)

> A complete hyperlocal delivery platform connecting customers with nearby couriers for instant deliveries

---

## 📋 Overview

Shipzy is a comprehensive delivery platform that enables customers to book instant deliveries and connects them with available couriers in their vicinity. The platform supports real-time tracking, secure payments, and seamless communication between all parties.

### 🏗️ Architecture

This is a **monorepo** containing:

- **Backend API** (`backend/`) - Node.js/Fastify REST API
- **User App** (`apps/user/`) - Flutter mobile app for customers
- **Driver App** (`apps/driver/`) - Flutter mobile app for couriers
- **Business Portal** (`apps/business/`) - Next.js web app for merchants/store owners

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

- **Backend**: Node.js 24.10+, PostgreSQL 14+, Firebase project
- **Mobile Apps**: Flutter 3.35+, Android Studio/XCode
- **Development**: Docker & Docker Compose (recommended)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/arshnirmal/shipzy.git
cd shipzy

# 2. Setup backend
cd backend
cp .env.example .env
# Edit .env with your configuration
pnpm install
pnpm run dev

# 3. Setup user app (in new terminal)
cd ../apps/user
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

```text
shipzy/
├── apps/                    # Frontend Applications
│   ├── business/           # Merchant Next.js Web Portal
│   │   ├── src/           # App Router source code
│   │   ├── public/        # Static assets
│   │   ├── .env.example   # Environment variables
│   │   └── package.json   # Web dependencies
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
├── backend/               # Node.js API Server
│   ├── docs/             # Documentation (API, deployment)
│   ├── scripts/          # Development scripts
│   ├── src/              # Source code
│   ├── tests/            # Test suites
│   ├── .env.example      # Environment variables
│   ├── docker-compose.dev.yml
│   └── package.json
└── README.md             # This file
```

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 24.10+ with ES Modules
- **Framework**: Fastify 5.8+ (high-performance web framework)
- **Database**: PostgreSQL 14+ with PostGIS & Drizzle ORM
- **Authentication**: Firebase Auth + JWT
- **Testing**: Jest with Supertest
- **Deployment**: Docker

### Mobile Apps (User & Driver)

- **Framework**: Flutter 3.35+ (Dart)
- **State Management**: Riverpod
- **Networking**: Dio HTTP client
- **Maps**: Mapbox integration
- **Notifications**: Firebase Cloud Messaging

### Business Portal (Web)

- **Framework**: Next.js 16+ (React 19)
- **UI/Styling**: Tailwind CSS v4 + Shadcn UI
- **State Management**: React Query (TanStack Query)

### Shared Practices

- **Linting**: ESLint (backend/business), Flutter analyze (apps)
- **CI/CD**: GitHub Actions

---

## 🔧 Development

### Available Scripts

```bash
# Backend development
cd backend
pnpm run dev          # Start development server
pnpm test            # Run test suite
pnpm run lint        # Lint code

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

1. **Docker / Containers** (Recommended for self-hosting)

   ```bash
   cd backend
   docker build -t shipzy-backend .
   docker run -p 3000:3000 shipzy-backend
   ```

2. **Cloud Platforms**
   - **Backend**: Koyeb, DigitalOcean Droplet, AWS EC2, or Vercel
   - **Mobile Apps**: Google Play Store, Apple App Store

### Infrastructure

- **Database**: PostgreSQL with PostGIS on cloud provider
- **File Storage**: Firebase Storage or AWS S3
- **CDN**: Cloudflare or AWS CloudFront
- **Monitoring**: Application logs, error tracking

> 📖 **Deployment Guide**: See [backend/docs/koyeb-deployment.md](backend/docs/koyeb-deployment.md)

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

- [Backend API Documentation](backend/README.md)
- [User App Documentation](apps/user/README.md)
- [Driver App Documentation](apps/driver/README.md)
- [System Architecture & API Docs](backend/docs/api-documentation.md)
- [API Reference](backend/docs/api/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the Shipzy development team.

**Questions?** Open an issue or reach out to the maintainers.
