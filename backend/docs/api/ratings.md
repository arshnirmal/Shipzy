# Ratings API

Base path: /api/v1/ratings

Source of truth:

- [backend/src/modules/ratings/ratings.routes.ts](../../src/modules/ratings/ratings.routes.ts)
- [backend/src/modules/ratings/ratings.schema.ts](../../src/modules/ratings/ratings.schema.ts)

## Access Pattern

- All rating routes require authentication

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
```

## Routes

| Method | Path                 | Auth                             | Notes                          |
| ------ | -------------------- | -------------------------------- | ------------------------------ |
| POST   | `/orders/:orderId`   | client                           | Rate a completed order         |
| GET    | `/drivers/:driverId` | client, courier, admin, business | Fetch driver rating statistics |

## Curl And Response Examples

Driver ratings are stored on `orders.requests.rating` JSONB; `ratingId` in API responses is the same as `orderId` for that row.

### POST /orders/:orderId

Auth: client role

Path params:

- orderId: positive integer

Request body:

```json
{
  "feedback": {
    "score": 5,
    "comment": "Great delivery experience",
    "anonymous": false
  }
}
```

```bash
curl -X POST "$API_BASE_URL/ratings/orders/1024" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"feedback":{"score":5,"comment":"Great delivery experience","anonymous":false}
	}'
```

```json
{
  "success": true,
  "message": "Rating submitted",
  "data": {
    "rating": {
      "ratingId": 1024,
      "orderId": 1024,
      "driverId": 77,
      "customerId": 12,
      "rating": 5,
      "isAnonymous": false,
      "comment": "Great delivery experience",
      "createdAt": "2026-04-16T10:00:00.000Z"
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /drivers/:driverId

Auth: client, courier, admin, or business

Path params:

- driverId: positive integer

```bash
curl -X GET "$API_BASE_URL/ratings/drivers/77" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Driver rating stats fetched",
  "data": {
    "rating": {
      "summary": {
        "average": 4.8,
        "total": 127
      },
      "distribution": {
        "1": 1,
        "2": 2,
        "3": 5,
        "4": 18,
        "5": 101
      },
      "recent": [
        {
          "rating": 5,
          "comment": "Fast and polite",
          "createdAt": "2026-04-15T08:30:00.000Z"
        }
      ],
      "lastUpdated": "2026-04-16T10:00:00.000Z"
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- Order ratings were moved out of the orders module and now live here.
- Validation is defined in `ratings.schema.ts`.
