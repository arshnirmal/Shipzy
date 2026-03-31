> See root CLAUDE.md for monorepo overview, git workflow, and shared conventions.

# Shipzy User App Guide

This app is the customer-facing mobile client for booking and tracking hyperlocal deliveries. It handles customer onboarding, pickup/drop management, fare preview, order lifecycle visibility, and customer profile flows. Use this file when editing user app UI, state management, repositories, API adapters, models, and app configuration.

## Directory Structure

```text
apps/user/
|- lib/
|  |- main.dart
|  |- app.dart
|  |- firebase_options.dart
|  |- models/
|  |- providers/
|  |- screens/
|  |- services/
|  |  |- dio/
|  |  |  |- api_client.dart
|  |  |  \- interceptors/
|  |  |- auth_service.dart
|  |  |- order_service.dart
|  |  |- orders_repository.dart
|  |  \- address_service.dart
|  |- theme/
|  |- utils/
|  \- widgets/
|- assets/
|- analysis_options.yaml
|- .env.example
|- pubspec.yaml
\- CLAUDE.md
```

## Architecture Pattern

Use this layer flow for all feature work:

```text
Widgets and Screens
  -> Providers and State Notifiers
  -> Repository Layer
  -> API Service (Dio)
  -> Backend REST API
```

Rules:

- Screens and widgets never invoke Dio directly.
- Domain decisions belong in provider/notifier/repository layers, not widget build methods.
- Network concerns stay in service or interceptor layers.
- Keep feature code grouped by customer use-cases, not by random utility growth.

## App-Specific Responsibilities

- Customer identity and sign-in UX.
- Pickup and drop address entry, selection, and validation.
- Fare quote retrieval and booking confirmation.
- Active order tracking views and status timeline rendering.
- Customer-side cancellation and order detail presentation.
- Saved addresses and profile edit flows.

## Naming Conventions

- File names: snake_case.
- Class names: PascalCase.
- Functions and variables: camelCase.
- Constants: kCamelCase.
- Widget files should end with \_screen.dart, \_widget.dart, or \_page.dart.
- Provider/state names should reflect user domain intent, not transport details.

## Code Style And Tooling

- Flutter/Dart null safety is mandatory.
- Do not force unwrap nullable values without an explicit safety reason comment.
- Use const constructors whenever possible.
- Keep user-facing strings centralized in constants/localization structures.
- Keep API host and environment config loaded from .env.
- Use Dio interceptors for auth header injection and token refresh behavior.
- Keep analysis_options clean; unresolved lint violations are not acceptable.

## Key Commands (Run From apps/user)

```bash
flutter pub get
flutter run
flutter analyze
flutter test
flutter build apk
flutter build ios
flutter build appbundle
```

## Critical Rules And Anti-Patterns

- NEVER hardcode API base URLs or auth tokens.
- NEVER place booking or tracking logic directly in widget build trees.
- NEVER manually attach auth headers in each request call site.
- NEVER skip loading, success, and error states for async actions.
- NEVER leave silent failures for order creation, address lookup, or fare calculation.
- NEVER bypass repository abstractions when adding new customer features.
- NEVER add environment keys without updating .env.example.
