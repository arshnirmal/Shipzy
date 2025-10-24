# Shipzy Client - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Flutter SDK >=3.2.0 <4.0.0
- Dart SDK (included with Flutter)
- Android Studio / Xcode (for mobile development)
- VS Code (recommended)

### Installation

1. **Clone and navigate to the project**

   ```bash
   cd apps/user
   ```

2. **Install dependencies**

   ```bash
   flutter pub get
   ```

3. **Generate code**

   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run the app**
   ```bash
   flutter run
   ```

## 📦 Project Structure

```
apps/user/
├── lib/
│   ├── app/                      # App-level configuration
│   │   ├── app.dart              # Main app widget
│   │   ├── router/               # Go Router configuration
│   │   └── providers/            # App-level providers
│   ├── core/                     # Core utilities
│   │   ├── network/              # Dio, Retrofit, Interceptors
│   │   ├── storage/              # Isar, Secure Storage
│   │   ├── services/             # Mapbox, UPI, Firebase
│   │   ├── theme/                # App theming
│   │   └── utils/                # Helpers, constants
│   ├── features/                 # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── home/                 # Home screen
│   │   ├── orders/               # Order management
│   │   ├── profile/              # User profile
│   │   └── ...                   # Other features
│   └── main.dart                 # App entry point
├── assets/                       # Images, fonts, etc.
├── build.yaml                    # Code generation config
├── pubspec.yaml                  # Dependencies
└── .env                          # Environment variables
```

## 🔧 Development Workflow

### Code Generation

**One-time generation:**

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

**Watch mode (auto-regenerate on changes):**

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

**Using scripts:**

```bash
./scripts/generate.sh    # One-time
./scripts/watch.sh       # Watch mode
```

**Using VS Code tasks:**

- Press `Cmd/Ctrl+Shift+B` → "Generate Code"
- Or use Command Palette → "Tasks: Run Task" → "Watch Code Generation"

### Adding New Features

1. **Create feature folder**

   ```
   lib/features/my_feature/
   ├── data/              # Data layer (repositories, DTOs)
   ├── domain/            # Domain layer (models, use cases)
   └── presentation/      # UI layer (screens, widgets, providers)
   ```

2. **Create model with Isar**

   ```dart
   import 'package:isar/isar.dart';
   import 'package:equatable/equatable.dart';

   @Collection(ignore: {'props', 'stringify'})
   class MyModel extends Equatable {
     final int id;
     final String name;

     const MyModel({required this.id, required this.name});

     // Add copyWith, toJson, fromJson, props
   }
   ```

3. **Create Riverpod provider**

   ```dart
   import 'package:riverpod_annotation/riverpod_annotation.dart';

   part 'my_provider.g.dart';

   @riverpod
   class MyNotifier extends _$MyNotifier {
     @override
     FutureOr<MyState> build() async {
       // Initialize state
     }

     // Add methods
   }
   ```

4. **Run code generation**

   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

5. **Use in UI**
   ```dart
   class MyScreen extends ConsumerWidget {
     @override
     Widget build(BuildContext context, WidgetRef ref) {
       final state = ref.watch(myNotifierProvider);
       // Build UI
     }
   }
   ```

## 🛠️ Common Tasks

### Adding a New Dependency

1. Add to `pubspec.yaml`
2. Run `flutter pub get`
3. If it's a code generation package, update `build.yaml`
4. Run `flutter pub run build_runner build --delete-conflicting-outputs`

### Creating API Client with Retrofit

```dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'api_client.g.dart';

@RestApi(baseUrl: '/api/v1')
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  @GET('/users/{id}')
  Future<User> getUser(@Path() String id);

  @POST('/users')
  Future<User> createUser(@Body() User user);
}
```

### Using Mapbox

```dart
final mapboxService = ref.read(mapboxServiceProvider);
final location = await mapboxService.getCurrentLocation();
final cameraOptions = mapboxService.createCameraOptions(
  latitude: location.latitude,
  longitude: location.longitude,
);
```

### UPI Payments

```dart
final upiService = ref.read(upiPaymentServiceProvider);
final apps = await upiService.getAvailableUpiApps();
final response = await upiService.initiatePayment(
  receiverUpiId: 'merchant@upi',
  receiverName: 'Merchant',
  amount: 100.0,
  transactionRef: 'TXN123',
  app: apps.first,
);
```

## 🧪 Testing

### Run all tests

```bash
flutter test
```

### Run specific test file

```bash
flutter test test/features/auth/auth_test.dart
```

### Integration tests

```bash
flutter test integration_test/
```

## 📱 Building for Production

### Android APK

```bash
flutter build apk --release
```

### Android App Bundle

```bash
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

## 🐛 Troubleshooting

### Dependency conflicts

```bash
flutter clean
flutter pub get
```

### Code generation issues

```bash
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

### Isar database issues

```bash
# Clear app data or reinstall the app
flutter clean
flutter pub get
flutter run
```

### Import errors

- Ensure all `part` directives are correct
- Run code generation
- Restart IDE/analyzer

## 📚 Key Technologies

| Technology    | Purpose          | Documentation                                                  |
| ------------- | ---------------- | -------------------------------------------------------------- |
| **Riverpod**  | State management | [riverpod.dev](https://riverpod.dev)                           |
| **Go Router** | Navigation       | [gorouter.dev](https://gorouter.dev)                           |
| **Isar**      | Local database   | [isar.dev](https://isar.dev)                                   |
| **Dio**       | HTTP client      | [pub.dev/packages/dio](https://pub.dev/packages/dio)           |
| **Retrofit**  | REST API client  | [pub.dev/packages/retrofit](https://pub.dev/packages/retrofit) |
| **Mapbox**    | Maps             | [docs.mapbox.com](https://docs.mapbox.com)                     |
| **Firebase**  | Auth, Analytics  | [firebase.google.com](https://firebase.google.com)             |

## 🔐 Environment Variables

Required in `.env`:

```env
API_BASE_URL=http://localhost:3000/api/v1
MAPBOX_ACCESS_TOKEN=your_mapbox_token
FIREBASE_API_KEY=your_firebase_key
# Add other keys as needed
```

## 🎨 Code Style

This project uses:

- `flutter_lints` ^4.0.0
- `riverpod_lint` ^2.3.13
- `custom_lint` ^0.6.7

Run linter:

```bash
flutter analyze
```

Auto-fix issues:

```bash
dart fix --apply
```

## 📖 Additional Resources

- [DEPENDENCY_RESOLUTION.md](./DEPENDENCY_RESOLUTION.md) - Detailed dependency resolution explanation
- [Flutter Documentation](https://docs.flutter.dev)
- [Dart Documentation](https://dart.dev/guides)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linter
4. Submit a pull request

## 📝 Notes

- Always run code generation after pulling changes
- Keep `.env` file secure (never commit it)
- Use VS Code tasks for common operations
- Check `DEPENDENCY_RESOLUTION.md` before adding new dependencies

---

Happy coding! 🚀


