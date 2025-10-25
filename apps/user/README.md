# 📱 Shipzy User App

[![Flutter](https://img.shields.io/badge/Flutter-3.0+-02569B.svg)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.9+-0175C2.svg)](https://dart.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange.svg)](https://firebase.google.com/)

> Customer mobile application for the Shipzy hyperlocal delivery platform

---

## 📋 Overview

Shipzy User App is a cross-platform Flutter application that allows customers to book instant deliveries, track orders in real-time, manage addresses, and communicate with delivery partners. Built with modern Flutter architecture and Firebase integration.

### ✨ Key Features

- 🔐 **Firebase Phone Authentication** - Secure OTP-based login
- 🚚 **Instant Delivery Booking** - Book deliveries with real-time pricing
- 📍 **Live Order Tracking** - Track delivery progress with Mapbox integration
- 🏠 **Address Management** - Save and manage multiple delivery addresses
- 💳 **Multiple Payment Methods** - Support for COD, UPI, and card payments
- 🔔 **Push Notifications** - Real-time delivery updates via FCM
- 📱 **Cross-Platform** - iOS and Android support
- 🌙 **Dark Mode Support** - Automatic theme switching
- 🗺️ **Interactive Maps** - Mapbox-powered location services

---

## 🚀 Quick Start

### Prerequisites

- **Flutter**: 3.0+ ([Installation Guide](https://flutter.dev/docs/get-started/install))
- **Dart**: 3.9+
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)
- **Firebase Project**: With Authentication and Cloud Messaging enabled

### Setup Instructions

```bash
# 1. Navigate to the user app directory
cd apps/user

# 2. Install Flutter dependencies
flutter pub get

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Firebase config and API endpoints

# 4. Configure Firebase (if not done automatically)
# Copy google-services.json to android/app/
# Copy GoogleService-Info.plist to ios/Runner/

# 5. Run code generation (for Riverpod, Freezed, etc.)
flutter pub run build_runner build --delete-conflicting-outputs

# 6. Run the app
flutter run

# For specific platforms:
flutter run -d android  # Android device/emulator
flutter run -d ios      # iOS simulator (macOS only)
```

### Build Instructions

```bash
# Build APK for Android
flutter build apk --release

# Build iOS app (macOS only)
flutter build ios --release

# Build app bundle for Play Store
flutter build appbundle --release
```

---

## 🏗️ Architecture

### Project Structure

```
apps/user/
├── lib/
│   ├── app/                    # Application configuration
│   │   ├── providers/         # Global app providers
│   │   └── router/           # Go Router configuration
│   ├── core/                  # Core functionality
│   │   ├── network/          # API client & interceptors
│   │   ├── services/         # Location, Mapbox services
│   │   ├── storage/          # Secure storage providers
│   │   ├── theme/           # App theming
│   │   └── utils/           # Logging utilities
│   ├── features/             # Feature modules
│   │   ├── auth/            # Authentication flow
│   │   ├── home/            # Home/dashboard screen
│   │   ├── order/           # Order management
│   │   ├── address/         # Address management
│   │   ├── payment/         # Payment processing
│   │   └── profile/         # User profile
│   ├── shared/              # Shared widgets & providers
│   ├── firebase_options.dart # Firebase configuration
│   └── main.dart           # App entry point
├── android/                 # Android configuration
├── ios/                    # iOS configuration
├── assets/                 # Images, icons, fonts
├── .env.example           # Environment variables template
└── pubspec.yaml          # Flutter dependencies
```

### State Management

- **Riverpod**: Declarative state management with dependency injection
- **Hooks Riverpod**: Functional programming approach with hooks
- **Freezed**: Immutable data classes with JSON serialization
- **ObjectBox**: Local database for offline data persistence

### Network Layer

- **Dio**: HTTP client with interceptors for auth and error handling
- **Retrofit**: Type-safe API client generation
- **Pretty Dio Logger**: Network request/response logging

---

## 🛠️ Technology Stack

### Core Framework

- **Flutter**: 3.0+ (Cross-platform UI framework)
- **Dart**: 3.9+ (Programming language)

### State Management & Data

- **Riverpod**: Reactive state management
- **Freezed**: Immutable data models
- **ObjectBox**: Embedded database
- **Shared Preferences**: Simple key-value storage

### Networking & APIs

- **Dio**: HTTP client
- **Retrofit**: REST API client
- **Firebase Auth**: Authentication
- **Firebase Messaging**: Push notifications

### Maps & Location

- **Mapbox Maps**: Interactive maps
- **Geolocator**: GPS location services
- **Geocoding**: Address from coordinates

### UI & UX

- **Flutter Animate**: Smooth animations
- **Shimmer**: Loading placeholders
- **Lottie**: Vector animations
- **Flutter Rating Bar**: Star ratings
- **Smooth Page Indicator**: Onboarding indicators

### Development Tools

- **Build Runner**: Code generation
- **Flutter Lints**: Code quality
- **Mockito**: Unit testing mocks
- **JSON Serializable**: JSON parsing

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root of the user app:

```env
# API Configuration
API_BASE_URL=https://api.shipzy.com
API_TIMEOUT=30000

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=your_mapbox_token
MAPBOX_STYLE_URL=mapbox://styles/mapbox/streets-v11

# App Configuration
APP_NAME=Shipzy
APP_VERSION=1.0.0
ENABLE_LOGS=true
```

### Firebase Setup

1. **Create Firebase Project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Authentication** with Phone provider
3. **Enable Cloud Messaging** for push notifications
4. **Download config files**:
   - `google-services.json` → `android/app/`
   - `GoogleService-Info.plist` → `ios/Runner/`

---

## 📱 Features Overview

### Authentication Flow

- Phone number verification with OTP
- Automatic token refresh
- Biometric authentication support

### Order Management

- Real-time fare calculation
- Multiple pickup/delivery addresses
- Order tracking with live updates
- Order history and details

### Address Management

- Save multiple addresses (home, work, etc.)
- GPS-based address detection
- Address validation and geocoding

### Payment Integration

- Cash on Delivery (COD)
- UPI payments
- Credit/Debit card support
- Payment status tracking

### Real-time Features

- Live order tracking on map
- Push notifications for status updates
- Driver location sharing
- Estimated delivery times

---

## 🧪 Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Run tests with coverage
flutter test --coverage

# Run specific test file
flutter test test/auth_repository_test.dart
```

### Test Structure

- **Unit Tests**: Individual functions and classes
- **Widget Tests**: UI component testing
- **Integration Tests**: Full user flows
- **Mockito**: Mocking external dependencies

---

## 🚢 Deployment

### Android (Google Play Store)

1. **Build Release APK**:

   ```bash
   flutter build apk --release
   ```

2. **Generate App Bundle**:

   ```bash
   flutter build appbundle --release
   ```

3. **Upload to Play Console** with proper signing configuration

### iOS (App Store)

1. **Build for iOS**:

   ```bash
   flutter build ios --release
   ```

2. **Open in Xcode**:

   ```bash
   open ios/Runner.xcworkspace
   ```

3. **Archive and upload** to App Store Connect

### CI/CD

GitHub Actions workflows are configured for:

- Automated testing on PRs
- Release builds for both platforms
- Code quality checks

---

## 🔧 Development Guidelines

### Code Style

- Follow [Flutter's style guide](https://flutter.dev/docs/development/tools/formatting)
- Use `flutter analyze` for linting
- Follow Riverpod patterns for state management
- Use Freezed for immutable data models

### Architecture Principles

- **Feature-first organization**: Group code by features
- **Dependency injection**: Use Riverpod providers
- **Separation of concerns**: UI, business logic, and data layers
- **Test-driven development**: Write tests before features

### Performance Tips

- Use `const` constructors for static widgets
- Implement proper state management to avoid rebuilds
- Use `ListView.builder` for long lists
- Optimize image loading with caching

---

## 📚 Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev/)
- [Firebase Flutter Docs](https://firebase.google.com/docs/flutter)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Shipzy Backend API](https://github.com/your-username/shipzy/tree/main/services/backend)

---

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Write tests for new features
3. Update this README for new features
4. Ensure CI checks pass
5. Create feature branches for changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

---

## 🆘 Troubleshooting

### Common Issues

**Firebase Configuration**

```bash
# Verify Firebase setup
flutter pub run flutterfire configure
```

**Build Issues**

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

**Platform-specific Issues**

```bash
# Android
flutter doctor --android-licenses

# iOS (macOS)
sudo gem install cocoapods
pod install
```

### Getting Help

- Check [Flutter Issues](https://github.com/flutter/flutter/issues)
- Review [Firebase Flutter Docs](https://firebase.google.com/docs/flutter)
- Open an issue in this repository

---

Built with ❤️ for the Shipzy platform.
