# Shipzy API Documentation

> Complete API reference for the Shipzy hyperlocal delivery backend service.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Drivers](#drivers)
- [Orders](#orders)
- [Addresses](#addresses)
- [Static Data](#static-data)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

### Base URL
```
https://api.shipzy.com/api/v1/auth
```

### Refresh Token
**POST** `/auth/refresh`

Refresh JWT access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Google Authentication
**POST** `/auth/google/verify`

Verify Google ID token and create/login user.

**Request Body:**
```json
{
  "idToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": "string",
      "uuid": "string",
      "email": "string",
      "fullName": "string",
      "phoneNumber": "string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 👥 Users

### Base URL
```
https://api.shipzy.com/api/v1/users
```

### Get Current User Profile
**GET** `/users/me`

Get the current authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "userId": "number",
    "userUuid": "string",
    "email": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Update User Profile
**PUT** `/users/me`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullName": "string",
  "phoneNumber": "string"
}
```

### Save Address
**POST** `/users/addresses`

Save a new address for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "label": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": "boolean"
}
```

### Delete Address
**DELETE** `/users/addresses/:addressId`

Delete a saved address.

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 🚗 Drivers

### Base URL
```
https://api.shipzy.com/api/v1/drivers
```

### Get Driver Profile
**GET** `/drivers/me`

Get the current authenticated driver's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "data": {
    "driverId": "number",
    "driverUuid": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "vehicleCategory": "string",
    "isAvailable": "boolean",
    "currentLocation": {
      "latitude": "number",
      "longitude": "number"
    },
    "rating": "number",
    "totalDeliveries": "number"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Update Driver Profile
**PUT** `/drivers/me`

Update the current driver's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullName": "string",
  "phoneNumber": "string",
  "vehicleCategoryId": "number"
}
```

### Update Availability
**PUT** `/drivers/availability`

Update driver's availability status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "isAvailable": "boolean"
}
```

### Update Location
**PUT** `/drivers/location`

Update driver's current location.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "latitude": "number",
  "longitude": "number"
}
```

---

## 📦 Orders

### Base URL
```
https://api.shipzy.com/api/v1/orders
```

### Calculate Fare
**POST** `/orders/calculate-fare`

Calculate fare estimate for a delivery.

**Request Body:**
```json
{
  "deliveryTypeId": "number",
  "vehicleCategoryId": "number",
  "weightTierId": "number",
  "packageTypeId": "number",
  "pickup": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "drop": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fare calculated successfully",
  "data": {
    "basePrice": "number",
    "distanceKm": "number",
    "distancePrice": "number",
    "weightSurcharge": "number",
    "platformFee": "number",
    "subtotalBeforeTax": "number",
    "gstAmount": "number",
    "totalPrice": "number",
    "currency": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Create Order
**POST** `/orders`

Create a new delivery order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "deliveryTypeId": "number",
  "vehicleCategoryId": "number",
  "weightTierId": "number",
  "packageTypeId": "number",
  "pickupLocation": {
    "address": "string",
    "latitude": "number",
    "longitude": "number",
    "contactName": "string",
    "contactPhone": "string"
  },
  "deliveryLocation": {
    "address": "string",
    "latitude": "number",
    "longitude": "number",
    "contactName": "string",
    "contactPhone": "string"
  },
  "items": [
    {
      "description": "string",
      "quantity": "number",
      "weightKg": "number"
    }
  ],
  "labels": ["string"],
  "packageDescription": "string",
  "paymentMethodId": "number"
}
```

### List Orders
**GET** `/orders`

Get paginated list of user's orders.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by order status

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [...],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Order Details
**GET** `/orders/:orderId`

Get detailed information about a specific order.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Cancel Order
**POST** `/orders/:orderId/cancel`

Cancel an existing order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cancellationReason": "string"
}
```

### Accept Order (Driver)
**POST** `/orders/:orderId/accept`

Accept an order as a driver.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Update Order Status
**PUT** `/orders/:orderId/status`

Update order status (picked up / delivered).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "status": "picked_up" | "delivered"
}
```

### Rate Order
**POST** `/orders/:orderId/rate`

Rate a completed order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "rating": "number",
  "comment": "string"
}
```

---

## 📍 Addresses

### Base URL
```
https://api.shipzy.com/api/v1/addresses
```

### Search Addresses
**POST** `/addresses/search`

Search for places using Mapbox Geocoding API.

**Request Body:**
```json
{
  "query": "string",
  "proximity": {
    "latitude": "number",
    "longitude": "number"
  },
  "limit": "number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Found X suggestions for 'query'",
  "data": [
    {
      "placeName": "string",
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "confidence": "number"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Retrieve Place Details
**POST** `/addresses/retrieve`

Get detailed information about a specific place.

**Request Body:**
```json
{
  "placeId": "string"
}
```

### Reverse Geocode
**POST** `/addresses/reverse`

Convert coordinates to human-readable address.

**Request Body:**
```json
{
  "latitude": "number",
  "longitude": "number"
}
```

### Get Directions
**POST** `/addresses/directions`

Get turn-by-turn directions between two points.

**Request Body:**
```json
{
  "origin": {
    "latitude": "number",
    "longitude": "number"
  },
  "destination": {
    "latitude": "number",
    "longitude": "number"
  },
  "profile": "driving" | "walking" | "cycling"
}
```

### Calculate Distance
**POST** `/addresses/distance`

Calculate distance and duration between two points.

**Request Body:**
```json
{
  "origins": [
    {
      "latitude": "number",
      "longitude": "number"
    }
  ],
  "destinations": [
    {
      "latitude": "number",
      "longitude": "number"
    }
  ]
}
```

---

## 📊 Static Data

### Base URL
```
https://api.shipzy.com/api/v1/static
```

### Get Delivery Types
**GET** `/static/delivery-types`

Get all available delivery types with pricing.

**Response:**
```json
{
  "success": true,
  "message": "Delivery types retrieved successfully",
  "data": [
    {
      "deliveryTypeId": "number",
      "name": "string",
      "displayName": "string",
      "baseRate": "number",
      "perKmRate": "number",
      "isActive": "boolean"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Weight Tiers
**GET** `/static/weight-tiers`

Get all available weight tiers.

**Response:**
```json
{
  "success": true,
  "message": "Weight tiers retrieved successfully",
  "data": [
    {
      "weightTierId": "number",
      "name": "string",
      "minWeightKg": "number",
      "maxWeightKg": "number",
      "isActive": "boolean"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Vehicle Categories
**GET** `/static/vehicle-categories`

Get all available vehicle categories.

### Get Package Types
**GET** `/static/package-types`

Get all available package types.

### Get Labels
**GET** `/static/labels`

Get all available order labels.

---

## ❌ Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🚦 Rate Limiting

### General Endpoints
- **Limit**: 100 requests per minute
- **Window**: 60 seconds

### Authentication Endpoints
- **Limit**: 10 requests per minute
- **Window**: 60 seconds

### Headers
Rate limiting information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔑 Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Token Expiration
- **Access Token**: 7 days
- **Refresh Token**: 30 days

Use the refresh token endpoint to obtain a new access token before expiration.

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in the local currency
- Coordinates use WGS84 decimal degrees format
- Pagination starts from page 1
- Maximum page size is 100 items

---

## 🧪 Testing

For testing purposes, you can use the health check endpoint:

**GET** `/health`

Returns the current status of the API and database connectivity.

---

*Last updated: March 2024*
