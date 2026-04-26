# Addresses API

Base path: /api/v1/addresses

Source of truth:

- [backend/src/modules/addresses/addresses.routes.ts](../../src/modules/addresses/addresses.routes.ts)
- [backend/src/modules/addresses/addresses.schema.ts](../../src/modules/addresses/addresses.schema.ts)

## Access Pattern

- All address routes require authentication

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
```

All endpoints below require:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Routes

| Method | Path               | Auth         | Notes                                               |
| ------ | ------------------ | ------------ | --------------------------------------------------- |
| POST   | `/search`          | Bearer token | Search address suggestions                          |
| POST   | `/retrieve`        | Bearer token | Retrieve a place by mapbox id and session token     |
| POST   | `/reverse-geocode` | Bearer token | Resolve coordinates to nearby places                |
| POST   | `/directions`      | Bearer token | Return route geometry and navigation details        |
| POST   | `/distance`        | Bearer token | Calculate straight-line distance between two points |

## Curl And Response Examples

### POST /search

Request body:

```json
{
  "query": "MG Road Bengaluru",
  "proximity": { "latitude": 12.9716, "longitude": 77.5946 },
  "country": "IN",
  "types": ["address", "place"],
  "limit": 5
}
```

```bash
curl -X POST "$API_BASE_URL/addresses/search" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"query":"MG Road Bengaluru",
		"proximity":{"latitude":12.9716,"longitude":77.5946},
		"country":"IN",
		"types":["address","place"],
		"limit":5
	}'
```

```json
{
  "success": true,
  "message": "Address suggestions fetched",
  "data": {
    "search": {
      "query": "MG Road Bengaluru",
      "sessionToken": "sess_abc123",
      "suggestions": [
        {
          "mapboxId": "dXJuOm1ieGFkci4uLg",
          "name": "MG Road",
          "fullAddress": "MG Road, Bengaluru, Karnataka, India",
          "coordinates": { "latitude": 12.975, "longitude": 77.609 },
          "placeType": "address",
          "context": {}
        }
      ],
      "total": 1
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /retrieve

Request body:

```json
{
  "mapboxId": "dXJuOm1ieGFkci4uLg",
  "sessionToken": "sess_abc123"
}
```

```bash
curl -X POST "$API_BASE_URL/addresses/retrieve" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"mapboxId":"dXJuOm1ieGFkci4uLg","sessionToken":"sess_abc123"}'
```

```json
{
  "success": true,
  "message": "Place details fetched",
  "data": {
    "place": {
      "mapboxId": "dXJuOm1ieGFkci4uLg",
      "name": "Brigade Road",
      "fullAddress": "Brigade Rd, Bengaluru, Karnataka, India",
      "coordinates": { "latitude": 12.973, "longitude": 77.608 },
      "featureType": "address",
      "bbox": null,
      "context": {}
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /reverse-geocode

Request body:

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "types": ["address", "place"],
  "limit": 3
}
```

```bash
curl -X POST "$API_BASE_URL/addresses/reverse-geocode" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"latitude":12.9716,"longitude":77.5946,"types":["address","place"],"limit":3}'
```

```json
{
  "success": true,
  "message": "Reverse geocode results fetched",
  "data": {
    "reverseGeocode": {
      "coordinates": { "latitude": 12.9716, "longitude": 77.5946 },
      "results": [],
      "total": 0
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /directions

Request body:

```json
{
  "origin": { "latitude": 12.9716, "longitude": 77.5946 },
  "destination": { "latitude": 12.9352, "longitude": 77.6245 },
  "profile": "driving"
}
```

```bash
curl -X POST "$API_BASE_URL/addresses/directions" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"origin":{"latitude":12.9716,"longitude":77.5946},
		"destination":{"latitude":12.9352,"longitude":77.6245},
		"profile":"driving"
	}'
```

```json
{
  "success": true,
  "message": "Directions fetched",
  "data": {
    "route": {
      "distanceMeters": 9200,
      "durationSeconds": 1600,
      "distanceKm": 9.2,
      "durationMinutes": 27,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [77.5946, 12.9716],
          [77.6245, 12.9352]
        ]
      }
    },
    "navigation": {
      "origin": { "latitude": 12.9716, "longitude": 77.5946 },
      "destination": { "latitude": 12.9352, "longitude": 77.6245 },
      "profile": "driving"
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /distance

Request body:

```json
{
  "lat1": 12.9716,
  "lon1": 77.5946,
  "lat2": 12.9352,
  "lon2": 77.6245
}
```

```bash
curl -X POST "$API_BASE_URL/addresses/distance" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"lat1":12.9716,"lon1":77.5946,"lat2":12.9352,"lon2":77.6245}'
```

```json
{
  "success": true,
  "message": "Distance calculated",
  "data": {
    "distance": { "kilometers": 5.24 },
    "points": {
      "origin": { "latitude": 12.9716, "longitude": 77.5946 },
      "destination": { "latitude": 12.9352, "longitude": 77.6245 }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- These endpoints are the map and geocoding helpers used by the mobile apps.
- Request validation lives in `addresses.schema.ts`.
