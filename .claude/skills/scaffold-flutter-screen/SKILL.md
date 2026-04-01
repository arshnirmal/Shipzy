---
name: scaffold-flutter-screen
description: >
  Scaffold a complete Flutter screen with BLoC pattern for Shipzy user or driver app.
  Invoke when asked to create a new screen, page, feature UI, or add a new user-facing view.
  Creates BLoC, events, states, repository, and screen files.
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: <app>/<screen_name>  e.g. user/order_history  OR  driver/earnings
---

# Scaffold Flutter Screen: $ARGUMENTS

Parse the argument as `<app>/<screen>`:
- `app` is either `user` or `driver` → maps to `apps/<app>/lib/`
- `screen` is `snake_case` feature name (e.g., `order_history`, `earnings_summary`)

## Read Existing Structure

!`find apps/$APP/lib -type d | head -30`

## Files to Create

Create all files inside `apps/<app>/lib/features/<screen>/`:

1. `bloc/<screen>_event.dart`
   - Sealed class extending `<Screen>Event`
   - Events: `<Screen>LoadRequested`, plus action-specific events

2. `bloc/<screen>_state.dart`
   - Sealed class extending `<Screen>State`
   - States: `<Screen>Initial`, `<Screen>Loading`, `<Screen>Loaded`, `<Screen>Error`

3. `bloc/<screen>_bloc.dart`
   - Extends `Bloc<<Screen>Event, <Screen>State>`
   - Handle all events, transition through states
   - Call repository methods only — no Dio calls directly

4. `repository/<screen>_repository.dart`
   - Abstract class + concrete implementation
   - Calls `ApiService` (shared Dio wrapper) — NEVER raw Dio

5. `screens/<screen>_screen.dart`
   - `BlocProvider` + `BlocBuilder` or `BlocConsumer`
   - Handle all 4 states: Initial (empty), Loading (skeleton), Loaded (data), Error (message + retry)

6. `widgets/` — empty folder placeholder for sub-widgets

## Requirements

- BLoC events: `PascalCase` + past tense verb (`LoadRequested`, `RefreshTriggered`)
- BLoC states: `PascalCase` + adjective (`Initial`, `Loading`, `Loaded`, `Error`)
- `const` constructors everywhere possible
- `flutter analyze` must pass with 0 warnings — no `// ignore:` without explanation
- Zero hardcoded strings — use constants file
- Loading state shows a skeleton widget — not a spinner alone
- Error state shows the error message + a retry button

After creation, show all file paths created and the GoRouter/Navigator registration needed.
