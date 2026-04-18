# Shipzy Driver App — End-to-End Implementation Plan

**Date:** 2026-04-18
**Scope:** `apps/driver/` Flutter app — complete feature wiring against Shipzy backend + minimal backend deltas
**Goal:** Functionally complete MVP driver app. UI polish deferred. Integrate every backend capability. Industry-standard patterns.
**Non-goals (this pass):** iOS build, UI polish, multi-stop orders, in-app chat, matching algorithms, driver document verification flow, business/admin app.

---

## 1. Context

- Backend driver spec (`2026-04-14-driver-order-management-design.md`) is implemented.
- Backend modules: `auth`, `users`, `drivers`, `orders`, `addresses`, `ratings`, `pricing`, `static`.
- `apps/driver/lib/` contains only a misnamed onboarding stub — treat as greenfield.
- `apps/user/lib/` uses older patterns; driver app is forward-reference for monorepo standards. User app aligns later.
- Deployment: Koyeb free (Fastify) + Neon free (Postgres + PostGIS). Scale-up to Koyeb paid ($5/mo) or DO droplet when load demands.

---

## 2. Locked Decisions

| Concern | Decision | Rationale |
|---|---|---|
| State mgmt | Riverpod (+ `riverpod_generator`) | Already in pubspec; generator = compile-time safety |
| Navigation | `go_router` | Already in pubspec; declarative deep links for order flow |
| Platform (MVP) | Android only | iOS deferred; Android covers target market |
| Background location | Foreground Service via `flutter_foreground_task` | Android-standard; persistent notif; reliable on Android 14+ |
| Push messaging | FCM (free unlimited) | No paid tier needed; firebase-admin already on backend host |
| Photo upload | Cloudinary unsigned preset, direct from app | Free 25GB; skips backend round-trip; preset `driver_undelivered` on cloud `dzjiebr8m` |
| PoD photo | Mandatory client-side (backend optional) | Dispute protection |
| Turn-by-turn nav | External Google Maps intent `google.navigation:q=lat,lng&mode=d` | Zero cost, known UX, no SDK bloat |
| Offline resilience | Queue **location pings only**; status transitions require online | Prevents split-brain order state |
| Wait-timer elapsed notice | Local notification + in-app banner | No backend cron needed; driver app computes from `waitUntil` |
| Customer contact | `tel:` launcher | Masked-number service deferred |
| Earnings | Today summary + paginated history list | Matches MVP B2C volume |
| Shift model | Explicit toggle + idle auto-offline | See §6 |
| Decline incoming sheet | Silent skip, no server record | No matching algo exists yet |
| Multi-device per driver | Single device only | Simpler; courier work is single-device reality |
| Firebase project | Shared w/ user app (shipzy-37e1c) | One service account to manage |

---

## 3. Backend Deltas (Lean)

No background jobs. No new modules. All additions fit existing structure.

| # | Change | Files | Effort |
|---|---|---|---|
| B1 | `fcm_token` column on `public.users` + index | `schema/public.ts`, `queries/users.queries.ts` | XS |
| B2 | `POST /users/me/device-token` endpoint (idempotent upsert) | `users.routes.ts`, `.controller.ts`, `.service.ts`, `.zod.ts`, `.schema.ts` | S |
| B3 | `src/services/fcm.service.ts` — firebase-admin multicast wrapper | new file | S |
| B4 | FCM dispatch hooks in order lifecycle: | `orders.service.ts` | M |
|   | - `order.created` → multicast nearby online couriers (reuse courier-nearby query) | | |
|   | - `order.cancelled` → direct send to assigned courier (if any) | | |
|   | - `order.accepted` → clear notification for other couriers (data-only msg) | | |
| B5 | Cancel guard: reject `POST /orders/:id/cancel` when status ∈ {picked_up, in_transit, undeliverable, returning, returned, delivered} | `orders.service.ts` cancel method | XS |
| B6 | `GET /orders/available` freshness filter — exclude pending older than 30min | `orders.queries.ts` | XS |
| B7 | `GET /drivers/me/trips?page=&limit=&dateFrom=&dateTo=` — paginated completed/returned/cancelled assignments | `drivers.routes/controller/service/repository/zod/schema` + new query | S |
| B8 | Heartbeat reuse — no new endpoint; `PATCH /drivers/me/location` already updates `last_location_update`. Service marks courier offline lazily on next read if stale > 10min | `drivers.service.ts` getMe/availability readers | XS |

**Out of scope (explicit defer):**
- Order TTL cron/pg_cron
- Rejection tracking
- Multi-device token table
- Wait-timer server-side push
- Masked phone numbers

---

## 4. Dependencies to Add (apps/driver/pubspec.yaml)

```yaml
# background + notifications
flutter_foreground_task: ^8.10.0
flutter_local_notifications: ^17.2.0
firebase_messaging: ^15.1.0

# connectivity + storage
connectivity_plus: ^6.0.0
sqflite: ^2.3.0
path_provider: ^2.1.0

# media + permissions
permission_handler: ^11.3.0
cloudinary_public: ^0.23.0
cached_network_image: ^3.4.0

# utility
url_launcher: ^6.3.0
```

Remove unused: (none currently; keep all existing).

Update `.env.example` with:
```
API_BASE_URL=
MAPBOX_TOKEN=
CLOUDINARY_CLOUD_NAME=dzjiebr8m
CLOUDINARY_UPLOAD_PRESET=driver_undelivered
FIREBASE_WEB_API_KEY=
```

---

## 5. Directory Layout (Target)

```text
apps/driver/lib/
├── main.dart
├── app.dart
├── firebase_options.dart
├── core/
│   ├── config/            # env loader, constants
│   ├── router/            # go_router config, route guards
│   ├── theme/             # moved from theme/
│   └── constants/         # strings.dart, k_values.dart
├── services/
│   ├── dio/
│   │   ├── api_client.dart
│   │   └── interceptors/  # auth, refresh, retry, logger
│   ├── auth_service.dart
│   ├── location_service.dart        # geolocator wrapper
│   ├── foreground_task_service.dart # flutter_foreground_task binding
│   ├── fcm_service.dart             # token + handlers + topic subs
│   ├── local_notification_service.dart
│   ├── cloudinary_service.dart
│   ├── offline_queue_service.dart   # sqflite for location pings
│   ├── connectivity_service.dart
│   └── storage_service.dart         # secure + prefs
├── features/
│   ├── auth/
│   │   ├── data/          # repository, remote datasource
│   │   ├── providers/     # Riverpod notifiers
│   │   ├── models/        # freezed DTOs
│   │   └── screens/       # login_screen, signup_screen
│   ├── onboarding/        # driver profile + vehicle setup
│   ├── duty/              # online toggle, nearby list, map
│   ├── orders/            # accept, flow, tracking, PoD
│   ├── earnings/          # today + history
│   └── profile/
├── models/                # shared envelope base, common DTOs
├── providers/             # app-wide: session, connectivity, duty
└── widgets/               # shared UI primitives
```

Delete `apps/driver/lib/screens/onboarding/onboarding_screen.dart` — replace w/ new driver flow under `features/auth` + `features/onboarding`.

---

## 6. Shift Model (Online/Offline)

### States
- `offline` — not visible to dispatch, no location broadcasting
- `online` — visible, location broadcasting, receiving FCM
- `onDelivery` — `online` + has active assignment (cannot accept another)

### Transitions
- Explicit toggle (Duty tab)
- On login: restore last state via secure storage prompt "Resume duty?"
- On app kill: foreground service keeps running; location heartbeat continues
- On foreground service stop (user swipe away or OS kill): backend detects stale `last_location_update > 10min` → marks offline lazily on next read
- Battery <15% → in-app warning; <5% → auto-offline + explain modal
- No active assignment + no nearby order interaction for 30min → soft prompt "Still on duty?" (local)

### Backend contract
- App calls `PATCH /drivers/me/availability` on explicit toggle
- App calls `PATCH /drivers/me/location` every 30s while online (doubles as heartbeat)
- No separate heartbeat endpoint

---

## 7. Screen Map & Routes (go_router)

```text
/                        → SplashScreen (auth gate redirect)
/login                   → LoginScreen (email + google)
/signup                  → SignupScreen
/onboarding              → OnboardingScreen (profile + vehicle — required before duty)
/permissions             → PermissionGateScreen (location + notif + camera)
/home                    → HomeShell (bottom nav)
  /home/duty             → DutyScreen (toggle + map + nearby list OR active card)
  /home/earnings         → EarningsScreen (today + history)
  /home/profile          → ProfileScreen
/order/:id               → OrderDetailsScreen (pre-accept preview)
/order/:id/flow          → OrderFlowShell (state-driven child screens)
  /order/:id/flow/to-pickup
  /order/:id/flow/to-delivery
  /order/:id/flow/arrived
  /order/:id/flow/undeliverable
  /order/:id/flow/returning
  /order/:id/flow/returned
  /order/:id/flow/pod
  /order/:id/flow/completed
```

### Modals / Overlays
- **IncomingOrderSheet** — full-height bottom sheet. Triggered by FCM data msg w/ `type=order.available`. Shows pickup/drop/distance/fare. 15s auto-dismiss. Accept button → `POST /orders/:id/accept` → handle 409 (taken) with toast.
- **CustomerCancelledDialog** — blocking modal. Triggered by FCM `type=order.cancelled`. "Customer cancelled. Return to available orders." → back to `/home/duty`.
- **WaitTimerBanner** — in-app banner on `ArrivedScreen`. Countdown to `waitUntil`. Local notif when elapsed.
- **OfflineBanner** — persistent top banner when connectivity_plus reports offline.

---

## 8. Driver-Side Order State Machine

Source of truth: backend order status. Client derives `OrderFlowState` from it.

```text
sealed class OrderFlowState {
  Idle
  Incoming(order)              // only from FCM sheet, pre-accept
  Accepted(order)              // → nav to pickup
  PickedUp(order)              // package collected, → nav to delivery
  InTransit(order)             // moving to delivery
  Arrived(order, waitUntil)    // at delivery, wait timer running
  DeliveringPod(order)         // PoD form open
  Undeliverable(order)         // note submitted, awaiting return decision
  Returning(order)             // nav back to pickup
  AtOrigin(order)              // at pickup for handback
  Returned(order)              // handback confirmed
  Completed(order)             // terminal: delivered or returned or cancelled
  CancelledByCustomer(order)
}
```

Notifier = `AsyncNotifier<OrderFlowState>`. Reconciles by polling `GET /orders/:id/tracking` every 20s while screen active + on FCM push. Transitions via respective endpoints.

---

## 9. Location Broadcasting Pipeline

```text
Foreground service (30s timer)
  └─ geolocator.getCurrentPosition(high, timeout 10s)
     └─ enqueue { lat, lng, speed, bearing, accuracy, capturedAt }
        └─ if online:
             └─ PATCH /drivers/me/location (latest only; drop older queued)
        └─ if offline:
             └─ persist in sqflite; evict entries > 15min old
        └─ on connectivity restore:
             └─ flush most-recent entry only (single PATCH)
```

### Tunables (from `.env`)
- `LOCATION_INTERVAL_SECS=30`
- `LOCATION_ACCURACY=high`
- `OFFLINE_QUEUE_MAX_AGE_MIN=15`

### Edge cases
- Permission revoked mid-session → foreground service posts "Location permission required" notif, sets app state `DutyState.paused`, suspends broadcasts until re-granted
- Mock location detected → log warning (no block for MVP)
- GPS timeout → skip this tick, retry next interval

---

## 10. FCM Integration

### Client
- Register token on login success → `POST /users/me/device-token`
- Re-register on token refresh (`FirebaseMessaging.onTokenRefresh`)
- Topic subs: none (direct device targeting only)
- Handlers:
  - **Foreground** → show in-app sheet/banner via Riverpod event bus
  - **Background** → system notification tray + tap deep-links to `/order/:id`
  - **Data-only msgs** → silent state update (e.g., `order.taken_by_other`)

### Payload contract
```json
{
  "type": "order.available | order.cancelled | order.accepted_by_other",
  "orderId": "1024",
  "orderNumber": "ORD-1024",
  "title": "New delivery 2.3km away",
  "body": "₹134 · Koramangala → HSR"
}
```

### Server dispatch points
- `orders.service.createOrder` → after insert, fire-and-forget multicast to couriers within 10km who are `is_online=true AND is_available=true AND current_assignment_id IS NULL`
- `orders.service.cancelOrder` → single-device push to assigned courier if exists
- `orders.service.acceptOrder` → data-only push to other couriers who saw this order (optional polish — skip for MVP)

---

## 11. Permissions Flow (Android)

Single `/permissions` gate screen before first duty-on:

1. `ACCESS_FINE_LOCATION` — required
2. `ACCESS_BACKGROUND_LOCATION` — required; separate dialog on Android 11+
3. `POST_NOTIFICATIONS` — required (Android 13+)
4. `CAMERA` — required for PoD/undeliverable photos
5. Battery-optimization exemption — requested; not blocking but warn

If any required denied → block duty toggle + show "Enable in settings" CTA.

AndroidManifest.xml additions documented in §14.

---

## 12. Feature-by-Feature API Wiring

### 12.1 Auth
| Action | Endpoint |
|---|---|
| Email login | `POST /auth/login` |
| Email signup | `POST /auth/register` (role=courier) |
| Google sign-in | `POST /auth/google` |
| Token refresh | `POST /auth/refresh` (Dio interceptor) |
| Logout | `POST /auth/logout` |
| Device token register | `POST /users/me/device-token` (NEW B2) |

### 12.2 Profile / Onboarding
| Action | Endpoint |
|---|---|
| Get profile | `GET /drivers/me` |
| Update profile | `PATCH /drivers/me` |
| Update user profile | `PATCH /users/me` |

Onboarding fields (MVP): fullName, phone, vehicle type + number. Document uploads deferred.

### 12.3 Duty
| Action | Endpoint |
|---|---|
| Toggle online/available | `PATCH /drivers/me/availability` |
| Location heartbeat | `PATCH /drivers/me/location` (every 30s) |
| Nearby orders | `GET /orders/available?latitude=&longitude=&radius=5` |
| Active assignment check | `GET /drivers/me/assignments` |

### 12.4 Order flow
| Action | Endpoint |
|---|---|
| Details | `GET /orders/:id` |
| Accept | `POST /orders/:id/accept` |
| Picked up | `PATCH /orders/:id/status {status:picked_up}` |
| In transit | `PATCH /orders/:id/status {status:in_transit}` |
| Arrive check-in | `POST /orders/:id/arrive` |
| Delivered | `PATCH /orders/:id/status {status:delivered}` |
| PoD | `POST /orders/:id/proof-of-delivery` |
| Undeliverable | `POST /orders/:id/undeliverable` |
| Start return | `POST /orders/:id/return` |
| Confirm returned | `POST /orders/:id/returned` |
| Live tracking poll | `GET /orders/:id/tracking` |

### 12.5 Earnings
| Action | Endpoint |
|---|---|
| Today summary | `GET /drivers/me/earnings?period=today` |
| Rating | `GET /drivers/me/rating` |
| Trip history | `GET /drivers/me/trips?page=&limit=` (NEW B7) |

---

## 13. Offline / Error Handling Matrix

| Scenario | Behavior |
|---|---|
| No internet on status transition | Block + toast "Connection required", auto-retry on reconnect |
| No internet during location tick | Queue; flush latest on reconnect |
| 401 on API call | Dio interceptor refresh → retry once → if still 401 → logout + `/login` |
| 409 on accept | Toast "Order already taken" + remove from local list |
| 409 on status PATCH (wrong state) | Reload order from `GET /orders/:id/tracking` — state desync recovery |
| FCM token refresh failed | Retry next app open |
| Cloudinary upload failed | In-screen retry; block form submission |
| Permission revoked mid-duty | Auto-pause duty, show blocker banner |
| App killed w/ active order | On relaunch → `GET /drivers/me/assignments` → resume OrderFlow state |
| Backend 5xx | Exponential backoff retry (max 3) via Dio interceptor, then toast |

---

## 14. AndroidManifest.xml Additions

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>

<service
  android:name="com.pravera.flutter_foreground_task.service.ForegroundService"
  android:foregroundServiceType="location"
  android:exported="false"/>
```

Target/compile SDK: 34+. `minSdkVersion`: 24.

---

## 15. Alignment With User App

Both apps must converge on:

| Concern | Shared Pattern |
|---|---|
| State mgmt | Riverpod + riverpod_generator |
| Routing | go_router |
| Networking | Dio + matching interceptor chain |
| Models | freezed + json_serializable |
| Envelope | same base `ApiResponse<T>` / `PaginatedResponse<T>` |
| Folder layout | `features/<name>/{data,providers,models,screens}` + shared `services/`, `core/` |
| Secure storage keys | identical constants file pattern |
| Theme | same Plus Jakarta Sans + theme tokens |

User app refactor to match: **separate pass, not part of driver MVP**. Driver app leads; user app catches up later.

---

## 16. Build Order (No UI polish)

Phase 0 — Foundations (do once, never touch again)
1. Clean slate: replace existing `screens/` stub, set up new directory layout
2. `.env` loader + `core/config/env.dart`
3. Dio client + auth/refresh/retry/logger interceptors
4. go_router config w/ redirect guard
5. Riverpod root + session provider + secure storage service
6. Theme + shared widgets skeleton

Phase 1 — Auth & identity
7. Login + signup screens + auth repository + providers
8. Onboarding (profile + vehicle)
9. Permission gate screen

Phase 2 — Push & background
10. Firebase init + `firebase_options.dart` regen
11. FCM service + device token registration (requires **B1 + B2 backend first**)
12. Local notification service
13. Foreground service + location service + offline queue (sqflite)

Phase 3 — Duty
14. Connectivity service + offline banner
15. Duty tab: online toggle + availability API
16. Location heartbeat pipeline
17. Nearby orders list (poll + FCM refresh) + map marker

Phase 4 — Order lifecycle (happy path)
18. Order details + accept
19. To-pickup screen + status PATCH + external nav launcher
20. To-delivery screen + location live map
21. Arrived screen + wait timer + local notif
22. PoD screen (mandatory photo + Cloudinary upload)
23. Completed screen

Phase 5 — Order lifecycle (RTO path)
24. Undeliverable form + Cloudinary upload
25. Start return + returning screen
26. Returned confirmation

Phase 6 — Tracking & reconciliation
27. Tracking poll integration (20s) for state reconciliation
28. Resume-after-kill via `/drivers/me/assignments`
29. Customer-cancelled modal path (**requires B4 + B5 backend**)

Phase 7 — Earnings & profile
30. Earnings today summary
31. Trip history paginated (**requires B7 backend**)
32. Rating display
33. Profile edit + logout

Phase 8 — Hardening
34. Error-matrix sweep (§13)
35. Permission-revoked-mid-session handling
36. Battery auto-offline
37. Onboarding idle prompt
38. `flutter analyze` = 0 issues; all unit-skipped integration flows manually verified on device

---

## 17. Deployment Notes

### Koyeb free caveats
- Free tier **sleeps on idle** → breaks FCM trigger freshness and wait-timer-dependent flows
- Neon free auto-suspends compute → first query after idle adds ~500ms
- **Recommendation**: move backend to Koyeb paid ($5/mo) when beta drivers onboard — cold-start UX kills trust
- Driver app should show connection-retry UI gracefully during cold starts

### Resource sizing
- firebase-admin SDK loaded adds ~70MB RSS
- DO droplet 512MB is **tight** with Fastify + firebase-admin + Dio clients; prefer 1GB droplet
- Neon free (0.25 CU) fine for MVP volume (<500 orders/day)

### Scaling signals
- p95 response time > 800ms sustained → upgrade backend compute first
- Neon storage > 400MB → consider pg-boss offload or paid tier
- Concurrent online drivers > 50 → add Redis for nearby-courier query caching (deferred)

---

## 18. Modified & Created Files Summary

### Backend (minimal)
- `src/database/schema/public.ts` — add `fcmToken` column
- `src/database/queries/users.queries.ts` — upsert device token query
- `src/modules/users/` — device-token endpoint (routes/controller/service/repository/zod/schema)
- `src/services/fcm.service.ts` — **new**
- `src/modules/orders/orders.service.ts` — FCM hooks + cancel guard
- `src/modules/orders/orders.queries.ts` — freshness filter on available
- `src/modules/drivers/` — trip history endpoint (routes/controller/service/repository/zod/schema)
- `src/database/queries/drivers.queries.ts` — paginated trip query

### Driver app (greenfield)
Entire `apps/driver/lib/` tree restructured per §5. Approximately:
- 8 service files
- 6 feature folders (auth, onboarding, duty, orders, earnings, profile)
- ~25 screens
- ~15 Riverpod notifiers
- ~30 freezed model files
- Dio interceptor chain
- Foreground-service entrypoint

---

## 19. Open Follow-Ups (Post-MVP)

- iOS build
- UI polish pass w/ proper design system
- User-app refactor to match driver-app patterns
- Matching algorithm + rejection tracking
- Masked phone numbers (Exotel / Knowlarity)
- Driver document verification flow
- Multi-stop orders
- In-app chat
- Admin web panel
- Wait-timer server-side push (if SLA demands)
- Order TTL auto-cancel (when cron infra added)
- Analytics + crash reporting (Firebase Crashlytics already in firebase project)

---

## 20. Acceptance Criteria

Driver app is done when a single device can:
1. Sign up + complete onboarding
2. Grant all permissions + go online
3. Receive FCM on new nearby order
4. Accept order, navigate to pickup via external maps, mark picked_up
5. Navigate to delivery, mark arrived, wait timer counts down, local notif fires at elapsed
6. Either: complete PoD (photo mandatory) OR submit undeliverable + return leg + returned
7. Receive FCM + blocking modal when customer cancels pre-pickup
8. View today's earnings + paginated history
9. Go offline + foreground service stops cleanly
10. Survive app-kill mid-delivery and resume state correctly
11. Handle offline → online transition without losing status

No backend migration scripts required (schema changes deployed via existing `db:deploy`).
