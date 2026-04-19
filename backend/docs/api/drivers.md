# Drivers API

Base path: /api/v1/drivers

Source of truth:

- [backend/src/modules/drivers/drivers.routes.ts](../../src/modules/drivers/drivers.routes.ts)
- [backend/src/modules/drivers/drivers.schema.ts](../../src/modules/drivers/drivers.schema.ts)

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

## Curl And Response Examples

### GET /me

```bash
curl -X GET "$API_BASE_URL/drivers/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response fields include: data.driver (profile + status + vehicle + earnings + rating).

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

Response payload: data.driver (BaseDriverCore fields).

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
