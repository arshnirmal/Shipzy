# Business API

Base path: /api/v1/business

Source of truth:

- [backend/src/modules/business/business.routes.ts](../../src/modules/business/business.routes.ts)
- [backend/src/modules/business/business.schema.ts](../../src/modules/business/business.schema.ts)

## Access Pattern

- All business routes require authentication
- All business routes require the `business` role

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<business-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Drafts

| Method | Path                 | Auth     | Notes               |
| ------ | -------------------- | -------- | ------------------- |
| POST   | `/drafts`            | business | Create a new draft  |
| GET    | `/drafts`            | business | List drafts         |
| GET    | `/drafts/:id`        | business | Fetch a draft by id |
| PATCH  | `/drafts/:id`        | business | Update a draft      |
| DELETE | `/drafts/:id`        | business | Delete a draft      |
| POST   | `/drafts/:id/submit` | business | Submit a draft      |

## Templates

| Method | Path                   | Auth     | Notes                          |
| ------ | ---------------------- | -------- | ------------------------------ |
| POST   | `/templates`           | business | Create a template              |
| GET    | `/templates`           | business | List templates                 |
| GET    | `/templates/:id`       | business | Fetch a template by id         |
| PATCH  | `/templates/:id`       | business | Update a template              |
| DELETE | `/templates/:id`       | business | Delete a template              |
| POST   | `/templates/:id/draft` | business | Create a draft from a template |

## Orders And Bulk Operations

| Method | Path                  | Auth     | Notes                  |
| ------ | --------------------- | -------- | ---------------------- |
| POST   | `/orders/bulk`        | business | Create multiple orders |
| POST   | `/orders/bulk-cancel` | business | Cancel multiple orders |
| GET    | `/orders/export`      | business | Export business orders |

## Analytics

| Method | Path         | Auth     | Notes                    |
| ------ | ------------ | -------- | ------------------------ |
| GET    | `/analytics` | business | Fetch business analytics |

## Notes

- The entire plugin applies `authenticate` and `authorize('business')` via hooks.
- Validation is defined per endpoint in `business.schema.ts`.

## Curl And Response Examples

### Drafts

#### POST /drafts

Request body:

```json
{
  "name": "Morning shipments",
  "fulfillment": {
    "deliveryTypeId": 1,
    "vehicleCategoryId": 1,
    "weightTierId": 1,
    "packageTypeId": 1,
    "paymentMethodId": 1
  },
  "pickupLocation": {
    "fullAddress": "Warehouse 14, Whitefield",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560066",
    "latitude": 12.996,
    "longitude": 77.76,
    "contactName": "Store Admin",
    "contactPhone": "+919000000001"
  },
  "deliveryLocation": {
    "fullAddress": "12 Koramangala 5th Block, Bengaluru",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560095",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "contactName": "Rahul",
    "contactPhone": "+919000000002"
  },
  "items": [{ "itemName": "Box", "quantity": 1 }],
  "package": { "notifyRecipientSms": true }
}
```

```bash
curl -X POST "$API_BASE_URL/business/drafts" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d @business-draft-create.json
```

Success response (201): data contains DraftResponse fields (draftId, state, fulfillment, locations, items, package, schedule, pricing, timestamps).

#### GET /drafts

Query params:

- page, limit, sortBy, sortOrder
- state: incomplete | ready | submitted

```bash
curl -X GET "$API_BASE_URL/business/drafts?page=1&limit=20&state=ready" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200):

```json
{
  "success": true,
  "message": "Drafts fetched",
  "data": {
    "drafts": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

#### GET /drafts/:id

```bash
curl -X GET "$API_BASE_URL/business/drafts/41" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data is one DraftResponse object.

#### PATCH /drafts/:id

Request body: same shape as create draft, all fields optional.

```bash
curl -X PATCH "$API_BASE_URL/business/drafts/41" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"name":"Updated batch name"}'
```

Success response (200): updated DraftResponse in data.

#### DELETE /drafts/:id

```bash
curl -X DELETE "$API_BASE_URL/business/drafts/41" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Draft deleted",
  "data": {
    "deletion": {
      "success": true
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

#### POST /drafts/:id/submit

Converts a draft to a real order.

```bash
curl -X POST "$API_BASE_URL/business/drafts/41/submit" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (201): data.order with full order payload (same shape as Orders create).

### Templates

#### POST /templates

Request body:

```json
{
  "name": "Daily Small Parcel",
  "description": "Template for small same-day parcels",
  "fulfillment": {
    "deliveryTypeId": 1,
    "vehicleCategoryId": 1,
    "weightTierId": 1,
    "packageTypeId": 1,
    "paymentMethodId": 1
  },
  "pickupLocation": {
    "fullAddress": "Warehouse 14, Whitefield",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560066",
    "latitude": 12.996,
    "longitude": 77.76,
    "contactName": "Store Admin",
    "contactPhone": "+919000000001"
  },
  "items": [{ "itemName": "Parcel", "quantity": 1 }],
  "package": { "notifyRecipientSms": true }
}
```

```bash
curl -X POST "$API_BASE_URL/business/templates" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d @business-template-create.json
```

Success response (201): data is TemplateResponse.

#### GET /templates

Query params:

- page, limit, sortBy, sortOrder
- isActive (default true)

```bash
curl -X GET "$API_BASE_URL/business/templates?page=1&limit=20&isActive=true" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.templates + data.pagination.

#### GET /templates/:id

```bash
curl -X GET "$API_BASE_URL/business/templates/9" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): one TemplateResponse object.

#### PATCH /templates/:id

Request body: partial of template create body.

```bash
curl -X PATCH "$API_BASE_URL/business/templates/9" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"description":"Updated description"}'
```

Success response (200): updated TemplateResponse.

#### DELETE /templates/:id

```bash
curl -X DELETE "$API_BASE_URL/business/templates/9" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200): data.deletion.success = true.

#### POST /templates/:id/draft

Creates a new draft from template.

```bash
curl -X POST "$API_BASE_URL/business/templates/9/draft" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (201): data is DraftResponse.

### Bulk Operations

#### POST /orders/bulk

Request body:

```json
{
  "orders": [
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
          "fullAddress": "Warehouse 14",
          "city": "Bengaluru",
          "state": "Karnataka",
          "postalCode": "560066",
          "latitude": 12.996,
          "longitude": 77.76,
          "contactName": "Store Admin",
          "contactPhone": "+919000000001"
        },
        "delivery": {
          "fullAddress": "Koramangala",
          "city": "Bengaluru",
          "state": "Karnataka",
          "postalCode": "560095",
          "latitude": 12.9352,
          "longitude": 77.6245,
          "contactName": "Rahul",
          "contactPhone": "+919000000002"
        }
      },
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
      }
    }
  ]
}
```

```bash
curl -X POST "$API_BASE_URL/business/orders/bulk" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d @business-bulk-create.json
```

Success response (201):

```json
{
  "success": true,
  "message": "Bulk order creation completed",
  "data": {
    "bulk": {
      "requested": 1,
      "created": 1,
      "failed": 0,
      "results": [
        {
          "index": 0,
          "success": true,
          "orderId": 1201
        }
      ]
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

#### POST /orders/bulk-cancel

Request body:

```json
{
  "orders": {
    "ids": [1201, 1202],
    "reason": "Bulk cancellation requested by operations"
  }
}
```

```bash
curl -X POST "$API_BASE_URL/business/orders/bulk-cancel" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"orders":{"ids":[1201,1202],"reason":"Bulk cancellation requested by operations"}}'
```

Success response (200): data.bulk { requested, cancelled, failed, results[] }.

### Export

#### GET /orders/export

Query params:

- dateFrom (optional string)
- dateTo (optional string)
- status: active | completed | cancelled
- format: csv (default csv)

```bash
curl -X GET "$API_BASE_URL/business/orders/export?status=completed&dateFrom=2026-04-01&dateTo=2026-04-16&format=csv" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response: CSV text payload (not JSON envelope).

### Analytics

#### GET /analytics

Query params:

- dateFrom: ISO datetime (required)
- dateTo: ISO datetime (required)

```bash
curl -X GET "$API_BASE_URL/business/analytics?dateFrom=2026-04-01T00:00:00.000Z&dateTo=2026-04-16T23:59:59.999Z" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Analytics fetched",
  "data": {
    "analytics": {
      "period": {
        "from": "2026-04-01T00:00:00.000Z",
        "to": "2026-04-16T23:59:59.999Z"
      },
      "orders": {
        "total": 120,
        "delivered": 108,
        "cancelled": 7,
        "active": 5,
        "successRate": 90
      },
      "spend": {
        "total": 165000,
        "average": 1375,
        "currency": "INR"
      },
      "delivery": {
        "avgDurationMins": 42
      }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Common Error Example

```json
{
  "success": false,
  "message": "Forbidden",
  "error": "Insufficient permissions",
  "statusCode": 403,
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```
