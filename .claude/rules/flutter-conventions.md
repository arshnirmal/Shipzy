---
paths:
  - "apps/**"
---

# Flutter Conventions

## Architecture (Non-Negotiable)

```
UI (Widgets / Screens)
       ↓
State Management (BLoC / Provider)
       ↓
Repository (API abstraction layer)
       ↓
API Service (Dio HTTP client with interceptors)
       ↓
Shipzy Backend REST API
```

- Widgets/Screens NEVER call Dio or API services directly
- Business logic NEVER lives in Widgets — it belongs in Blocs or Providers
- Repositories abstract ALL network calls — Screens only interact with state objects
- Auth headers and token refresh are handled by a Dio interceptor — NEVER add headers manually per-request

## File & Folder Naming

- Files: `snake_case` (`order_repository.dart`, `driver_bloc.dart`, `home_screen.dart`)
- Classes: `PascalCase` (`OrderRepository`, `DriverBloc`, `HomeScreen`)
- Screens: suffix `_screen.dart`
- Widgets: suffix `_widget.dart` or `_page.dart`
- Constants: `kCamelCase` prefix (`kApiBaseUrl`, `kMapboxToken`, `kDefaultRadius`)
- BLoC events: noun + verb past tense (`OrderFetchRequested`, `DriverLocationUpdated`, `AuthLogoutPressed`)
- BLoC states: noun + adjective (`OrderInitial`, `OrderLoading`, `OrderLoaded`, `OrderError`)

## Code Style

- Extract ALL user-facing strings to a constants or l10n file — zero hardcoded strings in Widget trees
- Load ALL config (API base URL, Mapbox token) from `.env` via a config constants file — never inline
- Handle `initial`, `loading`, `loaded`, and `error` BLoC states for every async operation in the UI
- Show a skeleton loader for loading states — not a blank screen or a spinner alone
- Use `const` constructors everywhere possible — it matters for tree rebuild performance
- Avoid the `!` null force-unwrap operator; if it is genuinely safe, add a comment explaining why
- Use `async`/`await` — avoid raw `.then()/.catchError()` chains

## Analysis & Linting

- `flutter analyze` must pass with **0 issues** before any commit
- NEVER add `// ignore: lint_rule` without a comment on the same line explaining the specific reason
- All rules in `analysis_options.yaml` are treated as errors — do not lower their severity
- NEVER use `print()` in production code — use a proper logging package

## Dart Null Safety

- Enable sound null safety (it's the default in Flutter 3.x)
- Prefer `?.` and `??` over `!` where possible
- Use `late` only for fields that are provably initialized before first use

## User App vs Driver App Specifics

- **User app** (`apps/user/`): order creation, real-time tracking view, fare calculation, address search, order history, rating
- **Driver app** (`apps/driver/`): availability toggle, order acceptance, location broadcasting, status updates, earnings summary
- Both apps share the same auth flow — Firebase/Google/Email via the same backend auth module
