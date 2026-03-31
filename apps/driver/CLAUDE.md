> See root CLAUDE.md for monorepo overview, git workflow, and shared conventions.

# Shipzy Driver App Guide

This app is the courier-facing mobile client for accepting, executing, and completing deliveries. It manages driver availability, assignment intake, navigation context, status updates, and delivery progress signaling back to backend services. Use this file when editing courier workflows, location update paths, assignment UI, repository logic, or driver-specific API integrations.

## Directory Structure

```text
apps/driver/
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
|  |  |- location_service.dart
|  |  |- api_service.dart
|  |  \- storage_service.dart
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

Use this layer flow for all courier features:

```text
Widgets and Screens
  -> Providers and State Notifiers
  -> Repository and Workflow Layer
  -> API Service (Dio)
  -> Backend REST API
```

Rules:

- Screens never perform direct HTTP calls.
- Assignment and state-transition logic stays outside widget rendering code.
- Location update orchestration belongs to dedicated service/provider layers.
- Delivery lifecycle transitions must map exactly to backend-accepted statuses.

## App-Specific Responsibilities

- Driver sign-in and courier profile lifecycle.
- Availability on/off switching and active duty state.
- Incoming assignment listing, accept/reject handling.
- Pickup to drop execution flow with status updates.
- Periodic or event-driven location publishing for active deliveries.
- Earnings and task history presentation for courier operations.

## Naming Conventions

- File names: snake_case.
- Class names: PascalCase.
- Functions and variables: camelCase.
- Constants: kCamelCase.
- Screen and widget files should end with \_screen.dart, \_widget.dart, or \_page.dart.
- Provider names should match courier concepts like assignment, availability, and delivery status.

## Code Style And Tooling

- Keep Dart null safety strict.
- Avoid force unwrap unless safety is guaranteed and documented inline.
- Use const constructors broadly to reduce rebuild cost.
- Keep display strings centralized, not spread through UI trees.
- Resolve runtime values from .env, never hardcode endpoints or secrets.
- Rely on Dio interceptors for auth and retry/token behavior.
- Keep analysis_options clean and treat lint issues as blockers.

## Key Commands (Run From apps/driver)

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

- NEVER let a driver screen mutate delivery status directly without provider/repository mediation.
- NEVER send out-of-order status transitions.
- NEVER hardcode location intervals, base URLs, or role values in feature code.
- NEVER attach auth headers manually per request.
- NEVER drop failed location/status updates silently; surface recoverable errors and retries.
- NEVER bypass repository logic when adding new assignment or earnings features.
- NEVER add config keys without updating .env.example.
