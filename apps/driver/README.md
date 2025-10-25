# 🚛 Shipzy Driver App

[![Flutter](https://img.shields.io/badge/Flutter-3.0+-02569B.svg)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.9+-0175C2.svg)](https://dart.dev/)
[![Status](https://img.shields.io/badge/Status-In_Development-yellow.svg)]()

> Courier mobile application for the Shipzy hyperlocal delivery platform

---

## 📋 Overview

Shipzy Driver App is a Flutter application designed for delivery couriers to accept orders, manage deliveries, track earnings, and provide real-time location updates. The app enables couriers to participate in the Shipzy delivery network.

> ⚠️ **Status**: This app is currently in early development stages. Core features are being implemented.

### ✨ Planned Features

- 🔐 **Firebase Phone Authentication** - Secure courier login
- 🚚 **Order Management** - Accept/reject delivery assignments
- 📍 **Live Location Tracking** - Real-time GPS location sharing
- 🗺️ **Interactive Maps** - Route optimization and navigation
- 💰 **Earnings Dashboard** - Track daily/weekly earnings and bonuses
- 📱 **Push Notifications** - Instant order assignments and updates
- 📷 **Proof of Delivery** - Photo capture and signature collection
- 🚗 **Vehicle Management** - Register and manage delivery vehicles
- ⏰ **Availability Status** - Online/offline mode with work hours
- ⭐ **Rating System** - Customer feedback and performance metrics

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
# 1. Navigate to the driver app directory
cd apps/driver

# 2. Install Flutter dependencies
flutter pub get

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Firebase config and API endpoints

# 4. Run the app
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

## 🏗️ Architecture (Planned)

### Project Structure

```
apps/driver/
├── lib/
│   ├── app/                    # Application configuration
│   │   ├── providers/         # Global app providers
│   │   └── router/           # Navigation configuration
│   ├── core/                  # Core functionality
│   │   ├── network/          # API client & interceptors
│   │   ├── services/         # Location, navigation services
│   │   ├── storage/          # Secure storage providers
│   │   └── utils/           # Logging and utilities
│   ├── features/             # Feature modules
│   │   ├── auth/            # Courier authentication
│   │   ├── dashboard/       # Main dashboard screen
│   │   ├── orders/          # Order management
│   │   ├── location/        # GPS tracking
│   │   ├── earnings/        # Earnings and analytics
│   │   ├── vehicle/         # Vehicle management
│   │   └── profile/         # Courier profile
│   ├── shared/              # Shared widgets & providers
│   ├── firebase_options.dart # Firebase configuration
│   └── main.dart           # App entry point
├── android/                 # Android configuration
├── ios/                    # iOS configuration
├── assets/                 # Images, icons, animations
├── .env.example           # Environment variables template
└── pubspec.yaml          # Flutter dependencies
```

### Planned Technology Stack

### Core Framework

- **Flutter**: 3.0+ (Cross-platform UI framework)
- **Dart**: 3.9+ (Programming language)

### State Management & Data

- **Riverpod**: Reactive state management
- **Freezed**: Immutable data models
- **ObjectBox**: Local database for offline data
- **Shared Preferences**: Simple key-value storage

### Networking & APIs

- **Dio**: HTTP client
- **Retrofit**: Type-safe API client generation
- **Firebase Auth**: Authentication
- **Firebase Messaging**: Push notifications

### Maps & Location

- **Mapbox Maps**: Interactive maps and navigation
- **Geolocator**: GPS location services
- **Background Location**: Continuous location tracking

### UI & UX

- **Flutter Animate**: Smooth animations
- **Shimmer**: Loading placeholders
- **Lottie**: Vector animations
- **Flutter Rating Bar**: Performance ratings

### Development Tools

- **Build Runner**: Code generation
- **Flutter Lints**: Code quality
- **Mockito**: Unit testing mocks
- **JSON Serializable**: JSON parsing

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root of the driver app:

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
MAPBOX_STYLE_URL=mapbox://styles/mapbox/navigation-day-v1

# App Configuration
APP_NAME=Shipzy Driver
APP_VERSION=1.0.0
ENABLE_LOGS=true

# Background Location
LOCATION_UPDATE_INTERVAL=30000
LOCATION_ACCURACY=high
```

### Firebase Setup

1. **Create Firebase Project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Authentication** with Phone provider
3. **Enable Cloud Messaging** for push notifications
4. **Configure background location** permissions
5. **Download config files**:
   - `google-services.json` → `android/app/`
   - `GoogleService-Info.plist` → `ios/Runner/`

---

## 📱 Planned Features Overview

### Courier Authentication

- Phone number verification with OTP
- Courier registration and verification
- Vehicle and license validation
- Background check integration

### Order Management

- Real-time order notifications
- Accept/reject order assignments
- Order details and customer information
- Route optimization and navigation
- Proof of delivery (photos/signatures)

### Location & Tracking

- Continuous GPS location updates
- Background location tracking
- Route recording and optimization
- Customer location sharing (with permission)

### Earnings & Analytics

- Daily/weekly/monthly earnings tracking
- Performance metrics and ratings
- Bonus calculations and incentives
- Payment history and settlements

### Vehicle Management

- Vehicle registration and verification
- Vehicle type and capacity settings
- Maintenance tracking and reminders
- Insurance and registration updates

### Real-time Communication

- Push notifications for new orders
- In-app messaging with customers
- Emergency contact features
- Support chat integration

---

## 🧪 Testing (Planned)

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Run widget tests
flutter test test/widget_test.dart

# Run tests with coverage
flutter test --coverage
```

### Planned Test Structure

- **Unit Tests**: Business logic and utility functions
- **Widget Tests**: UI component testing
- **Integration Tests**: Location services and API calls
- **E2E Tests**: Complete delivery workflows

---

## 🚢 Deployment (Planned)

### Android (Google Play Store)

1. **Build Release APK**:

   ```bash
   flutter build apk --release
   ```

2. **Generate App Bundle**:

   ```bash
   flutter build appbundle --release
   ```

3. **Configure background location permissions**
4. **Upload to Play Console** with proper signing

### iOS (App Store)

1. **Build for iOS**:

   ```bash
   flutter build ios --release
   ```

2. **Configure background location permissions** in Xcode
3. **Open in Xcode**:

   ```bash
   open ios/Runner.xcworkspace
   ```

4. **Archive and upload** to App Store Connect

### CI/CD

GitHub Actions workflows will be configured for:

- Automated testing on PRs
- Release builds for both platforms
- Code quality checks
- Performance monitoring

---

## 🔧 Development Guidelines

### Code Style

- Follow [Flutter's style guide](https://flutter.dev/docs/development/tools/formatting)
- Use `flutter analyze` for linting
- Implement proper error handling for location services
- Follow Riverpod patterns for state management

### Architecture Principles

- **Feature-first organization**: Group code by courier workflows
- **Background service management**: Handle location tracking properly
- **Battery optimization**: Efficient location updates
- **Offline-first**: Handle network connectivity issues
- **Security**: Protect sensitive location and payment data

### Performance Considerations

- **Background processing**: Efficient battery usage for location tracking
- **Memory management**: Handle large route data and maps
- **Network optimization**: Minimize API calls and data usage
- **UI responsiveness**: Smooth animations during navigation

### Security Requirements

- **Location data privacy**: Secure handling of GPS coordinates
- **Payment information**: PCI compliance for earnings data
- **Authentication**: Strong session management
- **Data encryption**: Secure local storage of sensitive data

---

## 📚 Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Background Location in Flutter](https://pub.dev/packages/flutter_background_geolocation)
- [Mapbox Navigation](https://docs.mapbox.com/ios/navigation/)
- [Firebase Flutter Docs](https://firebase.google.com/docs/flutter)
- [Shipzy Backend API](https://github.com/your-username/shipzy/tree/main/services/backend)

---

## 🤝 Contributing

### Development Status

This app is currently in active development. Key areas for contribution:

1. **Authentication Module** - Firebase phone auth implementation
2. **Location Services** - Background GPS tracking
3. **Order Management** - Real-time order handling
4. **UI/UX Design** - Courier-focused interface design
5. **Navigation** - Route optimization and turn-by-turn directions

### Getting Started with Development

1. Review the [User App README](../user/README.md) for reference architecture
2. Check existing issues and feature requests
3. Follow the established patterns from the user app
4. Focus on courier-specific workflows and requirements
5. Test extensively on real devices for location features

### Code Review Process

- All PRs require review from at least one maintainer
- Location and navigation features require additional testing
- Performance implications must be documented
- Battery and resource usage impact must be assessed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

---

## 🆘 Troubleshooting

### Common Issues

**Location Permissions**

```bash
# iOS - Reset location permissions
# Settings > Privacy & Security > Location Services > Reset Location & Privacy
```

**Background Location**

```bash
# Android - Check background location permission
# Settings > Apps > [App] > Permissions > Location > Allow all the time
```

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

### Performance Optimization

- **Location Updates**: Balance accuracy vs battery usage
- **Map Rendering**: Optimize for smooth navigation
- **Memory Usage**: Handle large route datasets efficiently

### Testing on Real Devices

- Location features must be tested on physical devices
- Background location requires device testing
- Push notifications need real device testing

---

## 📞 Support & Contact

- **Issues**: Open GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the [Backend API docs](../backend/README.md)

---

Built with ❤️ for Shipzy couriers.
