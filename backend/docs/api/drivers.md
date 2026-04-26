# Drivers API

Base path: /api/v1/drivers

Source of truth:

- [backend/src/modules/drivers/drivers.routes.ts](../../src/modules/drivers/drivers.routes.ts)
- [backend/src/modules/drivers/drivers.schema.ts](../../src/modules/drivers/drivers.schema.ts)
- [backend/src/modules/drivers/drivers.zod.ts](../../src/modules/drivers/drivers.zod.ts)

## Access Pattern

- All driver routes require authentication
- All driver routes require the `courier` role

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<courier-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Routes

| Method | Path               | Auth    | Notes                                 |
| ------ | ------------------ | ------- | ------------------------------------- |
| GET    | `/me`              | courier | Fetch the current driver profile      |
| PATCH  | `/me`              | courier | Update profile and/or vehicle details   |
| PATCH  | `/me/availability` | courier | Toggle availability and online status |
| PATCH  | `/me/location`     | courier | Update the current driver location    |
| GET    | `/me/assignments`  | courier | List active assignments               |
| GET    | `/me/earnings`     | courier | Fetch earnings summary for a period   |
| GET    | `/me/rating`       | courier | Fetch driver rating statistics        |
| POST   | `/me/kyc`          | courier | Submit KYC document URLs (license, vehicle reg, insurance) |
| GET    | `/me/trips`        | courier | Paginated completed / historical trips |

## Curl And Response Examples

### GET /me

```bash
curl -X GET "$API_BASE_URL/drivers/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success: `data.driver` — same user identity fields as [Users API](./users.md) (`userId`, `userUuid`, `role: "courier"`, names, flags, optional `createdAt` / `updatedAt`) plus courier-specific fields:

- **`status`**: availability, online flag, deliveries today, `currentLocation`, `lastLocationUpdate` (see `DriverStatusZ` in `drivers.zod.ts`).
- **`vehicle`**: nested object or `null`. When present, includes optional `vehicleId`, `isActive`, **`category`** (`id`, `name`, `maxWeightKg` from `vehicle_categories` + join), and **`specification`** (`vehicleNumber`, `model`, `year` from `courier_status.vehicle` JSONB). Data can appear even when `vehicleId` is unset, as long as category / JSONB vehicle data exists.
- **`onboarding`**: optional; from `users.profiles.onboarding` (`status`, `stepsCompleted`, optional `submittedAt`, `approvedAt`, `rejectedReason`) — see `OnboardingJSONBZ` in [backend/src/database/schema/types.ts](../../src/database/schema/types.ts).
- **`kyc`**: optional; from `logistics.courier_status.kyc` — document metadata (`license`, `vehicleReg`, `insurance` with `url` and optional `number`, `expiresAt`, `verifiedAt`); see `KycJSONBZ` in `types.ts`.
- **`earnings`**, **`rating`**: summary blocks on GET (see `DriverProfileResponseZ`).

Example (illustrative):

```json
{
  "success": true,
  "message": "Driver profile fetched",
  "data": {
    "driver": {
      "userId": 10,
      "userUuid": "1c8d1dc5-c619-49de-91db-a0e10e98bc18",
      "role": "courier",
      "fullName": "Rohit Kumar",
      "email": "rohit@example.com",
      "phoneNumber": "+919777777777",
      "profilePictureUrl": null,
      "isVerified": true,
      "isActive": true,
      "status": {
        "isAvailable": true,
        "isOnline": true,
        "totalDeliveriesToday": 3,
        "currentLocation": { "latitude": 12.9716, "longitude": 77.5946 },
        "lastLocationUpdate": "2026-04-16T10:00:00.000Z"
      },
      "vehicle": {
        "category": { "id": 1, "name": "Two-wheeler", "maxWeightKg": 20 },
        "specification": {
          "vehicleNumber": "KA01AB1234",
          "model": "Activa",
          "year": 2022
        }
      },
      "onboarding": {
        "status": "pending_review",
        "stepsCompleted": ["profile", "vehicle", "kyc"],
        "submittedAt": "2026-04-16T09:00:00.000Z"
      },
      "kyc": {
        "license": { "url": "https://cdn.example.com/lic.pdf" },
        "vehicleReg": { "url": "https://cdn.example.com/reg.pdf" },
        "insurance": { "url": "https://cdn.example.com/ins.pdf" }
      },
      "earnings": {
        "total": 55200,
        "today": 340,
        "thisWeek": 3140,
        "thisMonth": 10400,
        "averageOrderValue": 173.2,
        "totalDistanceKm": 1890.6
      },
      "rating": { "averageRating": 4.8, "totalRatings": 12 }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### PATCH /me

Request body: include at least one of `profile` (non-empty object) or `vehicle`.

Profile fields (all optional inside `profile`):

- `fullName`, `email`, `profilePictureUrl`, `phoneNumber`

Vehicle (optional object `vehicle`): written to `logistics.courier_status` as JSONB plus `vehicle_category_id` for dispatch.

- `categoryId` (required): must reference an active row in `public.vehicle_categories`
- `vehicleNumber` (required)
- `model`, `year`, `insuranceExpiry`, `registrationDocumentUrl` (optional)

```json
{
  "profile": {
    "fullName": "Rohit Kumar",
    "phoneNumber": "+919777777777"
  }
}
```

```json
{
  "vehicle": {
    "categoryId": 1,
    "vehicleNumber": "KA01AB1234",
    "model": "Activa",
    "year": 2022
  }
}
```

```bash
curl -X PATCH "$API_BASE_URL/drivers/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"profile":{"fullName":"Rohit Kumar","phoneNumber":"+919777777777"}}'
```

```bash
curl -X PATCH "$API_BASE_URL/drivers/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"vehicle":{"categoryId":1,"vehicleNumber":"KA01AB1234","model":"Activa","year":2022}}'
```

Response payload: `data.driver` with **`BaseDriverCoreZ`** fields (no top-level `earnings` / `rating` on PATCH — those are GET-only enrichments).

### POST /me/kyc

Submit HTTPS URLs for required documents. Body:

```json
{
  "license": { "url": "https://cdn.example.com/license.pdf" },
  "vehicleReg": { "url": "https://cdn.example.com/rc.pdf" },
  "insurance": { "url": "https://cdn.example.com/insurance.pdf" }
}
```

```bash
curl -X POST "$API_BASE_URL/drivers/me/kyc" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"license":{"url":"https://cdn.example.com/license.pdf"},"vehicleReg":{"url":"https://cdn.example.com/rc.pdf"},"insurance":{"url":"https://cdn.example.com/insurance.pdf"}}'
```

Success: `data.onboarding` with `status`, `stepsCompleted`, optional `submittedAt` (see `SubmitKycResponseZ`).

### GET /me/trips

Query parameters (all optional except defaults):

- `page` (default `1`)
- `limit` (default `20`, max `50`)
- `dateFrom`, `dateTo` (optional filters)

```bash
curl -X GET "$API_BASE_URL/drivers/me/trips?page=1&limit=10" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success: `data.trips` (array of trip items) and `data.pagination` (`page`, `limit`, `total`, `totalPages`). See `TripHistoryResponseZ` in `drivers.zod.ts`.

### PATCH /me/availability

Request body:

```json
{
  "availability": {
    "isAvailable": true,
    "isOnline": true
  },
  "tracking": {
    "currentLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  }
}
```

```bash
curl -X PATCH "$API_BASE_URL/drivers/me/availability" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"availability":{"isAvailable":true,"isOnline":true},
		"tracking":{"currentLocation":{"latitude":12.9716,"longitude":77.5946}}
	}'
```

```json
{
  "success": true,
  "message": "Availability updated",
  "data": {
    "availability": {
      "courierId": 42,
      "isAvailable": true,
      "isOnline": true,
      "updatedAt": "2026-04-16T10:00:00.000Z"
    },
    "tracking": {
      "currentLocation": {
        "latitude": 12.9716,
        "longitude": 77.5946
      }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### PATCH /me/location

Request body:

```json
{
  "location": {
    "current": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  },
  "locationMeta": {
    "speed": 8.5,
    "bearing": 180,
    "accuracy": 6.2
  }
}
```

```bash
curl -X PATCH "$API_BASE_URL/drivers/me/location" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"location":{"current":{"latitude":12.9716,"longitude":77.5946}},
		"locationMeta":{"speed":8.5,"bearing":180,"accuracy":6.2}
	}'
```

Response payload: data.location (courierId, current, lastLocationUpdate).

### GET /me/assignments

```bash
curl -X GET "$API_BASE_URL/drivers/me/assignments" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Response payload: data.assignments (assignment, status, routing, snapshot, package, pricing, earnings, timeline).

### GET /me/earnings

Query params:

- period: today | week | month | year (default: today)

```bash
curl -X GET "$API_BASE_URL/drivers/me/earnings?period=week" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Earnings fetched",
  "data": {
    "earnings": {
      "scope": { "period": "week" },
      "deliveries": {
        "today": 2,
        "total": 250,
        "thisWeek": 18,
        "thisMonth": 62
      },
      "earnings": {
        "today": 340,
        "total": 55200,
        "thisWeek": 3140,
        "thisMonth": 10400,
        "averageOrderValue": 173.2
      },
      "activity": { "totalDistanceKm": 1890.6 }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /me/rating

```bash
curl -X GET "$API_BASE_URL/drivers/me/rating" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Driver rating fetched",
  "data": {
    "rating": {
      "averageRating": 4.8,
      "totalRatings": 127,
      "ratingDistribution": { "1": 1, "2": 2, "3": 5, "4": 18, "5": 101 },
      "lastUpdated": "2026-04-16T10:00:00.000Z"
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- The whole plugin is guarded by `authenticate` plus `authorize('courier')` hooks.
- Validation is defined in `drivers.schema.ts`.
