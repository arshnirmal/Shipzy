# Orders API

Base path: /api/v1/orders

Source of truth:

- [backend/src/modules/orders/orders.routes.ts](../../src/modules/orders/orders.routes.ts)
- [backend/src/modules/orders/orders.schema.ts](../../src/modules/orders/orders.schema.ts)

## Access Pattern

- All order routes require authentication
- Route-level authorization varies by action

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

Success envelope:

```json
{
  "success": true,
  "message": "Human readable success message",
  "data": {},
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

Paginated list envelope (GET /orders):

```json
{
  "success": true,
  "message": "Orders fetched",
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Fare And Creation

| Method | Path              | Auth         | Notes                               |
| ------ | ----------------- | ------------ | ----------------------------------- |
| POST   | `/calculate-fare` | Bearer token | Estimate order pricing and duration |
| POST   | `/`               | client       | Create a new order                  |

## Order Retrieval

| Method | Path            | Auth                      | Notes                                  |
| ------ | --------------- | ------------------------- | -------------------------------------- |
| GET    | `/`             | client, business          | List orders for the current actor      |
| GET    | `/available`    | courier                   | List available orders near the courier |
| GET    | `/:id`          | client, courier, business | Fetch order details                    |
| GET    | `/:id/tracking` | client, courier, admin    | Fetch live tracking for an order       |

## Order Lifecycle

| Method | Path          | Auth             | Notes                                               |
| ------ | ------------- | ---------------- | --------------------------------------------------- |
| POST   | `/:id/cancel` | client, business | Cancel an order                                     |
| POST   | `/:id/accept` | courier          | Accept an assigned order                            |
| PATCH  | `/:id/status` | courier          | Move an order through pickup, transit, and delivery |

## Courier Exception Handling

| Method | Path                     | Auth    | Notes                                |
| ------ | ------------------------ | ------- | ------------------------------------ |
| POST   | `/:id/arrive`            | courier | Record arrival at the delivery point |
| POST   | `/:id/undeliverable`     | courier | Mark an order as undeliverable       |
| POST   | `/:id/return`            | courier | Start a return-to-origin flow        |
| POST   | `/:id/returned`          | courier | Confirm the order was returned       |
| POST   | `/:id/proof-of-delivery` | courier | Submit proof of delivery             |

## Notes

- The route plugin applies `authenticate` to every order endpoint, so `calculate-fare` is authenticated in the implementation.
- Order rating is not handled here; use [Ratings API](ratings.md).
- Validation is defined in `orders.schema.ts`.
- Persisted orders always include `fulfillment.paymentMethodId` (matches `orders.requests.payment_method_id`, NOT NULL).
- Proof-of-delivery: `recipientSignatureUrl` in the request body is stored as `signatureUrl` inside the `orders.requests.pod` JSONB column (see `backend/src/database/schema/types.ts` `PodJSONBZ`).

## Curl And Response Examples

### POST /calculate-fare

Auth: any authenticated user

Request body:

```json
{
  "fulfillment": {
    "deliveryTypeId": 1,
    "vehicleCategoryId": 1,
    "weightTierId": 1,
    "packageTypeId": 1
  },
  "locations": {
    "pickup": { "latitude": 12.9716, "longitude": 77.5946 },
    "delivery": { "latitude": 12.9352, "longitude": 77.6245 }
  }
}
```

```bash
curl -X POST "$API_BASE_URL/orders/calculate-fare" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"fulfillment":{"deliveryTypeId":1,"vehicleCategoryId":1,"weightTierId":1,"packageTypeId":1},
		"locations":{"pickup":{"latitude":12.9716,"longitude":77.5946},"delivery":{"latitude":12.9352,"longitude":77.6245}}
	}'
```

```json
{
  "success": true,
  "message": "Fare calculated",
  "data": {
    "pricing": {
      "basePrice": 30,
      "distanceKm": 9.2,
      "distancePrice": 73.6,
      "weightSurcharge": 0,
      "platformFee": 10,
      "specialHandlingFee": 0,
      "subtotalBeforeTax": 113.6,
      "gstAmount": 20.45,
      "totalPrice": 134.05,
      "currency": "INR"
    },
    "estimatedDurationMins": 27
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /

Auth: client

Request body:

```json
{
  "fulfillment": {
    "deliveryTypeId": 1,
    "vehicleCategoryId": 1,
    "weightTierId": 1,
    "packageTypeId": 1,
    "paymentMethodId": 1
  },
  "locations": {
    "pickup": {
      "fullAddress": "22 Church Street, Bengaluru",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560001",
      "latitude": 12.9754,
      "longitude": 77.6058,
      "contactName": "Ava Sharma",
      "contactPhone": "+919999999999"
    },
    "delivery": {
      "fullAddress": "12 Koramangala 5th Block, Bengaluru",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560095",
      "latitude": 12.9352,
      "longitude": 77.6245,
      "contactName": "Rahul",
      "contactPhone": "+919888888888"
    }
  },
  "package": {
    "description": "Documents",
    "specialInstructions": "Handle carefully",
    "declaredValue": 2000,
    "notifyRecipientSms": true
  },
  "schedule": {
    "pickupAt": null,
    "deliveryAt": null
  },
  "pricing": {
    "basePrice": 30,
    "distanceKm": 9.2,
    "distancePrice": 73.6,
    "weightSurcharge": 0,
    "platformFee": 10,
    "specialHandlingFee": 0,
    "subtotalBeforeTax": 113.6,
    "gstAmount": 20.45,
    "totalPrice": 134.05,
    "currency": "INR"
  },
  "items": [
    {
      "itemName": "Envelope",
      "quantity": 1,
      "weightKg": 0.2
    }
  ]
}
```

```bash
curl -X POST "$API_BASE_URL/orders" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d @create-order.json
```

Success response (201): data.order with full BaseOrder shape.

### GET /

Auth: client, business

Query params:

- page (default 1)
- limit (default 20)
- sortBy
- sortOrder (asc|desc, default desc)
- status (active|completed|cancelled)
- dateFrom (ISO datetime)
- dateTo (ISO datetime)
- search
- deliveryTypeId
- minPrice
- maxPrice

```bash
curl -X GET "$API_BASE_URL/orders?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=desc" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Orders fetched",
  "data": [
    {
      "order": {
        "identifiers": {
          "orderId": 1024,
          "orderUuid": "fdffcb8e-08fb-46bb-b7e6-b4d9e710fd4f",
          "orderNumber": "ORD-1024"
        },
        "status": "accepted",
        "metrics": {
          "estimatedDistanceKm": 9.2,
          "actualDistanceKm": null,
          "actualDurationMins": null,
          "totalPrice": 134.05
        },
        "timeline": { "createdAt": "2026-04-16T09:00:00.000Z" },
        "fulfillment": {
          "deliveryTypeId": 1,
          "vehicleCategoryId": 1,
          "weightTierId": 1,
          "packageTypeId": 1,
          "paymentMethodId": 1
        },
        "locations": { "pickup": {}, "delivery": {} },
        "package": { "notifyRecipientSms": true },
        "schedule": {},
        "pricing": {
          "basePrice": 30,
          "distanceKm": 9.2,
          "distancePrice": 73.6,
          "weightSurcharge": 0,
          "platformFee": 10,
          "specialHandlingFee": 0,
          "subtotalBeforeTax": 113.6,
          "gstAmount": 20.45,
          "totalPrice": 134.05
        },
        "items": []
      },
      "courier": null
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /available

Auth: courier

Query params:

- latitude (required)
- longitude (required)
- radius (optional, default 10)
- limit (optional, default 20)

```bash
curl -X GET "$API_BASE_URL/orders/available?latitude=12.9716&longitude=77.5946&radius=5&limit=20" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data is array of { order, distanceFromDriverKm }.

### GET /:id

Auth: client, courier, business

```bash
curl -X GET "$API_BASE_URL/orders/1024" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.order (with assignment and cancellation), data.actors.client, data.actors.courier.

### POST /:id/cancel

Auth: client, business

Request body:

```json
{
  "cancellation": {
    "reason": "Customer is unavailable at destination"
  }
}
```

```bash
curl -X POST "$API_BASE_URL/orders/1024/cancel" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"cancellation":{"reason":"Customer is unavailable at destination"}}'
```

Success response (200):

```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "order": {
      "orderId": 1024,
      "status": "cancelled",
      "cancelledAt": "2026-04-16T10:00:00.000Z",
      "cancellationReason": "Customer is unavailable at destination"
    },
    "refund": {
      "initiated": true,
      "amount": 134.05,
      "status": "pending"
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /:id/accept

Auth: courier

```bash
curl -X POST "$API_BASE_URL/orders/1024/accept" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.assignment and data.order (accepted state).

### PATCH /:id/status

Auth: courier

Request body:

```json
{
  "transition": {
    "status": "picked_up"
  }
}
```

Allowed statuses: picked_up, in_transit, delivered.

```bash
curl -X PATCH "$API_BASE_URL/orders/1024/status" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"transition":{"status":"picked_up"}}'
```

Success response (200): data.order { orderId, status, timestamp }.

### POST /:id/arrive

Auth: courier

Request body:

```json
{
  "gps": {
    "latitude": 12.9352,
    "longitude": 77.6245
  }
}
```

```bash
curl -X POST "$API_BASE_URL/orders/1024/arrive" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"gps":{"latitude":12.9352,"longitude":77.6245}}'
```

Success response (200): data { arrivedAt, waitUntil, waitMinutes }.

### POST /:id/undeliverable

Auth: courier

Request body:

```json
{
  "driverNote": "Customer unreachable",
  "photoUrl": "https://cdn.example.com/proof.jpg"
}
```

```bash
curl -X POST "$API_BASE_URL/orders/1024/undeliverable" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"driverNote":"Customer unreachable","photoUrl":"https://cdn.example.com/proof.jpg"}'
```

Success response (200): data.order { orderId, status: undeliverable, undeliverableAt }.

### POST /:id/return

Auth: courier

```bash
curl -X POST "$API_BASE_URL/orders/1024/return" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.order { orderId, status: returning, returnStartedAt }.

### POST /:id/returned

Auth: courier

```bash
curl -X POST "$API_BASE_URL/orders/1024/returned" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.order { orderId, status: returned, returnedAt }.

### POST /:id/proof-of-delivery

Auth: courier

Request body:

```json
{
  "recipientName": "Rahul",
  "photoUrl": "https://cdn.example.com/pod.jpg",
  "recipientSignatureUrl": "https://cdn.example.com/signature.png",
  "deliveryNotes": "Handed over at gate"
}
```

```bash
curl -X POST "$API_BASE_URL/orders/1024/proof-of-delivery" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"recipientName":"Rahul",
		"photoUrl":"https://cdn.example.com/pod.jpg",
		"recipientSignatureUrl":"https://cdn.example.com/signature.png",
		"deliveryNotes":"Handed over at gate"
	}'
```

Success response (201): data.proof { proofId, orderId, deliveredAt }.

### GET /:id/tracking

Auth: client, courier, admin

```bash
curl -X GET "$API_BASE_URL/orders/1024/tracking" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Tracking fetched",
  "data": {
    "order": { "orderId": 1024, "status": "in_transit" },
    "driver": {
      "location": { "latitude": 12.95, "longitude": 77.61 },
      "locationMeta": { "speed": 8.5, "bearing": 180, "accuracy": 6.2 },
      "lastUpdatedAt": "2026-04-16T10:00:00.000Z"
    },
    "milestones": [
      {
        "eventType": "picked_up",
        "description": "Package picked up",
        "location": { "lat": 12.9754, "lng": 77.6058 },
        "timestamp": "2026-04-16T09:45:00.000Z"
      }
    ],
    "attempt": null
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Common Error Example

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "transition.status must be one of: picked_up, in_transit, delivered",
  "statusCode": 400,
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```
