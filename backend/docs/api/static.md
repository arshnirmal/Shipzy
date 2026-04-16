# Static API

Base path: /api/v1/static

Source of truth:

- [backend/src/modules/static/static.routes.ts](../../src/modules/static/static.routes.ts)
- [backend/src/modules/static/static.schema.ts](../../src/modules/static/static.schema.ts)

## Access Pattern

- These routes are public

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
```

Success envelope:

```json
{
  "success": true,
  "message": "Static data fetched",
  "data": {},
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Routes

| Method | Path                  | Auth   | Notes                                           |
| ------ | --------------------- | ------ | ----------------------------------------------- |
| GET    | `/delivery-types`     | Public | List delivery types                             |
| GET    | `/weight-tiers`       | Public | List weight tiers                               |
| GET    | `/vehicle-categories` | Public | List vehicle categories                         |
| GET    | `/package-types`      | Public | List package types                              |
| GET    | `/payment-methods`    | Public | List payment methods                            |
| GET    | `/create-order-data`  | Public | Fetch all data needed for the create-order flow |
| GET    | `/order-statuses`     | Public | List supported order statuses                   |

## Curl And Response Examples

### GET /delivery-types

```bash
curl -X GET "$API_BASE_URL/static/delivery-types"
```

```json
{
  "success": true,
  "message": "Delivery types fetched",
  "data": {
    "deliveryTypes": [
      {
        "deliveryTypeId": 1,
        "name": "instant",
        "displayName": "Instant",
        "description": "Fastest delivery",
        "pricing": { "baseRate": 30, "perKmRate": 8 },
        "supportedVehicles": [],
        "sortOrder": 1,
        "isActive": true
      }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /weight-tiers

```bash
curl -X GET "$API_BASE_URL/static/weight-tiers"
```

```json
{
  "success": true,
  "message": "Weight tiers fetched",
  "data": {
    "weightTiers": [
      {
        "tierId": 1,
        "name": "0-1kg",
        "minWeightKg": 0,
        "maxWeightKg": 1,
        "additionalCharge": 0
      }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /vehicle-categories

```bash
curl -X GET "$API_BASE_URL/static/vehicle-categories"
```

```json
{
  "success": true,
  "message": "Vehicle categories fetched",
  "data": {
    "vehicleCategories": [
      {
        "categoryId": 1,
        "name": "bike",
        "displayName": "Bike",
        "description": "Suitable for small parcels",
        "maxWeightKg": 10,
        "iconUrl": null,
        "isActive": true
      }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /package-types

```bash
curl -X GET "$API_BASE_URL/static/package-types"
```

```json
{
  "success": true,
  "message": "Package types fetched",
  "data": {
    "packageTypes": [
      { "packageTypeId": 1, "name": "document", "description": null }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /payment-methods

```bash
curl -X GET "$API_BASE_URL/static/payment-methods"
```

```json
{
  "success": true,
  "message": "Payment methods fetched",
  "data": {
    "paymentMethods": [
      {
        "methodId": 1,
        "name": "cash",
        "displayName": "Cash",
        "description": "Pay on delivery",
        "isActive": true
      }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /create-order-data

```bash
curl -X GET "$API_BASE_URL/static/create-order-data"
```

```json
{
  "success": true,
  "message": "Create-order static data fetched",
  "data": {
    "createOrder": {
      "deliveryTypes": [],
      "packageTypes": [],
      "paymentMethods": []
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /order-statuses

```bash
curl -X GET "$API_BASE_URL/static/order-statuses"
```

```json
{
  "success": true,
  "message": "Order statuses fetched",
  "data": {
    "orderStatuses": [
      "pending",
      "accepted",
      "picked_up",
      "in_transit",
      "delivered"
    ],
    "total": 5
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- Static data is intended for app bootstrapping and order creation flows.
- Validation is defined in `static.schema.ts`.
