# Shipzy API Documentation

> Complete API reference for the Shipzy hyperlocal delivery backend service.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Drivers](#drivers)
- [Orders](#orders)
- [Addresses](#addresses)
- [Static Data](#static-data)
- [Health Check](#health-check)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

### Base URL
```
https://api.shipzy.com/api/v1/auth
```

### Register
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "role": "client" | "courier",
  "phoneNumber": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "number",
      "userUuid": "string",
      "role": "client" | "courier",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "profilePictureUrl": "string",
      "isVerified": "boolean",
      "isActive": "boolean",
      "createdAt": "string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresIn": "number",
      "tokenType": "Bearer"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "number",
      "userUuid": "string",
      "role": "client" | "courier",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "profilePictureUrl": "string",
      "isVerified": "boolean",
      "isActive": "boolean",
      "createdAt": "string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresIn": "number",
      "tokenType": "Bearer"
    }
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
  "idToken": "string",
  "role": "client" | "courier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "userId": "number",
      "userUuid": "string",
      "role": "client" | "courier",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "profilePictureUrl": "string",
      "isVerified": "boolean",
      "isActive": "boolean",
      "createdAt": "string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresIn": "number",
      "tokenType": "Bearer"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
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
    "expiresIn": "number",
    "tokenType": "Bearer"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logout
**POST** `/auth/logout`

Logout the current user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
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
    "role": "client" | "courier",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "profilePictureUrl": "string",
    "isVerified": "boolean",
    "isActive": "boolean",
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
  "email": "string",
  "phoneNumber": "string",
  "profilePictureUrl": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "number",
    "userUuid": "string",
    "role": "client" | "courier",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "profilePictureUrl": "string",
    "isVerified": "boolean",
    "isActive": "boolean",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Saved Addresses
**GET** `/users/me/addresses`

Get all saved addresses for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "addressId": "number",
      "fullAddress": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "building": "string",
      "floor": "string",
      "flatNumber": "string",
      "landmark": "string",
      "addressType": "home" | "work" | "other",
      "label": "string",
      "isDefault": "boolean",
      "createdAt": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Save Address
**POST** `/users/me/addresses`

Save a new address for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullAddress": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "building": "string",
  "floor": "string",
  "flatNumber": "string",
  "landmark": "string",
  "addressType": "home" | "work" | "other",
  "label": "string",
  "isDefault": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address saved successfully",
  "data": {
    "addressId": "number",
    "fullAddress": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "building": "string",
    "floor": "string",
    "flatNumber": "string",
    "landmark": "string",
    "addressType": "home" | "work" | "other",
    "label": "string",
    "isDefault": "boolean",
    "createdAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Delete Address
**DELETE** `/users/me/addresses/:id`

Delete a saved address.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
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
    "userId": "number",
    "userUuid": "string",
    "role": "courier",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "profilePictureUrl": "string",
    "isVerified": "boolean",
    "isActive": "boolean",
    "status": {
      "isAvailable": "boolean",
      "isOnline": "boolean",
      "totalDeliveriesToday": "number",
      "currentLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "lastLocationUpdate": "string"
    },
    "vehicle": {
      "vehicleId": "number",
      "categoryId": "number",
      "category": "string",
      "isActive": "boolean",
      "vehicleNumber": "string",
      "model": "string",
      "year": "number"
    },
    "earnings": {
      "total": "number",
      "today": "number",
      "thisWeek": "number",
      "thisMonth": "number",
      "averageOrderValue": "number",
      "totalDistanceKm": "number"
    },
    "rating": {
      "averageRating": "number",
      "totalRatings": "number"
    },
    "createdAt": "string",
    "updatedAt": "string"
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
  "email": "string",
  "phoneNumber": "string",
  "profilePictureUrl": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver profile updated successfully",
  "data": {
    "userId": "number",
    "userUuid": "string",
    "role": "courier",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "profilePictureUrl": "string",
    "isVerified": "boolean",
    "isActive": "boolean",
    "status": {
      "isAvailable": "boolean",
      "isOnline": "boolean",
      "totalDeliveriesToday": "number",
      "currentLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "lastLocationUpdate": "string"
    },
    "vehicle": {
      "vehicleId": "number",
      "categoryId": "number",
      "category": "string",
      "isActive": "boolean",
      "vehicleNumber": "string",
      "model": "string",
      "year": "number"
    },
    "earnings": {
      "total": "number",
      "today": "number",
      "thisWeek": "number",
      "thisMonth": "number",
      "averageOrderValue": "number",
      "totalDistanceKm": "number"
    },
    "rating": {
      "averageRating": "number",
      "totalRatings": "number"
    },
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Update Availability
**PUT** `/drivers/me/availability`

Update driver's availability status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "isAvailable": "boolean",
  "isOnline": "boolean",
  "currentLocation": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "isAvailable": "boolean",
    "isOnline": "boolean",
    "currentLocation": {
      "latitude": "number",
      "longitude": "number"
    },
    "lastLocationUpdate": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Update Location
**PUT** `/drivers/me/location`

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

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Active Assignments
**GET** `/drivers/me/assignments`

Get driver's active order assignments.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Active assignments retrieved successfully",
  "data": [
    {
      "assignmentId": "number",
      "order": {
        "orderId": "number",
        "orderUuid": "string",
        "orderNumber": "string",
        "status": "string",
        "pickup": {
          "address": "string",
          "latitude": "number",
          "longitude": "number",
          "contactName": "string",
          "contactPhone": "string"
        },
        "delivery": {
          "address": "string",
          "latitude": "number",
          "longitude": "number",
          "contactName": "string",
          "contactPhone": "string"
        },
        "fareBreakdown": {
          "basePrice": "number",
          "distanceKm": "number",
          "distancePrice": "number",
          "weightSurcharge": "number",
          "platformFee": "number",
          "subtotalBeforeTax": "number",
          "gstAmount": "number",
          "totalPrice": "number",
          "currency": "string"
        }
      },
      "assignedAt": "string",
      "acceptedAt": "string",
      "status": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Earnings
**GET** `/drivers/me/earnings`

Get driver's earnings summary.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Earnings retrieved successfully",
  "data": {
    "total": "number",
    "today": "number",
    "thisWeek": "number",
    "thisMonth": "number",
    "averageOrderValue": "number",
    "totalDistanceKm": "number",
    "recentOrders": [
      {
        "orderId": "number",
        "orderNumber": "string",
        "completedAt": "string",
        "earnings": "number",
        "distanceKm": "number"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Rating
**GET** `/drivers/me/rating`

Get driver's rating statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Rating retrieved successfully",
  "data": {
    "averageRating": "number",
    "totalRatings": "number"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
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
    "longitude": "number"
  },
  "drop": {
    "latitude": "number",
    "longitude": "number"
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
    "currency": "string",
    "estimatedDurationMins": "number"
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
  "paymentMethodId": "number",
  "packageDescription": "string",
  "specialInstructions": "string",
  "scheduledPickupTime": "string",
  "scheduledDeliveryTime": "string",
  "declaredValue": "number",
  "notifyRecipientSms": "boolean",
  "couponCode": "string",
  "fareBreakdown": {
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
  "pickup": {
    "fullAddress": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "building": "string",
    "floor": "string",
    "flatNumber": "string",
    "landmark": "string",
    "howToReach": "string",
    "contactName": "string",
    "contactPhone": "string"
  },
  "delivery": {
    "fullAddress": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "building": "string",
    "floor": "string",
    "flatNumber": "string",
    "landmark": "string",
    "howToReach": "string",
    "contactName": "string",
    "contactPhone": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "number",
    "orderUuid": "string",
    "orderNumber": "string",
    "status": "string",
    "fareBreakdown": {
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
    "estimatedDistanceKm": "number",
    "estimatedDurationMins": "number",
    "createdAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
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
- `status` (string): Filter by order status (active, completed, cancelled)
- `dateFrom` (string): Filter orders from this date
- `dateTo` (string): Filter orders to this date
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "orderId": "number",
      "orderUuid": "string",
      "orderNumber": "string",
      "status": "string",
      "createdAt": "string",
      "pickup": {
        "address": "string",
        "city": "string"
      },
      "delivery": {
        "address": "string",
        "city": "string"
      },
      "totalPrice": "number",
      "estimatedDeliveryTime": "string"
    }
  ],
  "meta": {
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

### Get Available Orders (Drivers)
**GET** `/orders/available`

Get available orders for drivers to accept.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `latitude` (number): Driver's current latitude
- `longitude` (number): Driver's current longitude
- `radius` (number): Search radius in km (default: 10)
- `limit` (number): Maximum results (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Available orders retrieved successfully",
  "data": [
    {
      "orderId": "number",
      "orderUuid": "string",
      "orderNumber": "string",
      "deliveryTypeDisplay": "string",
      "vehicleCategoryDisplay": "string",
      "createdAt": "string",
      "pickup": {
        "address": "string",
        "city": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      },
      "delivery": {
        "address": "string",
        "city": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      },
      "fareBreakdown": {
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
      "estimatedDistanceKm": "number",
      "distanceFromDriverKm": "number",
      "packageDescription": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Order Details
**GET** `/orders/:id`

Get detailed information about a specific order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "orderId": "number",
    "orderUuid": "string",
    "orderNumber": "string",
    "status": "string",
    "statusId": "number",
    "deliveryTypeId": "number",
    "deliveryTypeDisplay": "string",
    "vehicleCategoryId": "number",
    "vehicleCategoryDisplay": "string",
    "packageDescription": "string",
    "packageTypeId": "number",
    "weightTierId": "number",
    "weightTierDisplay": "string",
    "specialInstructions": "string",
    "pickup": {
      "locationId": "number",
      "address": "string",
      "building": "string",
      "floor": "string",
      "flat": "string",
      "landmark": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "contactName": "string",
      "contactPhone": "string"
    },
    "delivery": {
      "locationId": "number",
      "address": "string",
      "building": "string",
      "floor": "string",
      "flat": "string",
      "landmark": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "contactName": "string",
      "contactPhone": "string"
    },
    "fareBreakdown": {
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
    "client": {
      "userId": "number",
      "name": "string",
      "phone": "string",
      "profilePictureUrl": "string"
    },
    "courier": {
      "userId": "number",
      "name": "string",
      "phone": "string",
      "profilePictureUrl": "string",
      "vehicle": {
        "vehicleId": "number",
        "categoryId": "number",
        "category": "string",
        "isActive": "boolean",
        "vehicleNumber": "string",
        "model": "string",
        "year": "number"
      },
      "rating": {
        "averageRating": "number",
        "totalRatings": "number"
      }
    },
    "timeline": {
      "confirmedAt": "string",
      "assignedAt": "string",
      "pickedUpAt": "string",
      "deliveredAt": "string",
      "cancelledAt": "string"
    },
    "estimatedDistanceKm": "number",
    "actualDistanceKm": "number",
    "actualDurationMins": "number",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Cancel Order
**POST** `/orders/:id/cancel`

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

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Accept Order (Driver)
**POST** `/orders/:id/accept`

Accept an order as a driver.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "assignmentId": "number",
    "orderId": "number",
    "acceptedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Update Order Status (Driver)
**PUT** `/orders/:id/status`

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

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": "number",
    "status": "string",
    "updatedAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Order
**POST** `/orders/:id/rate`

Rate a completed order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "rating": "number",
  "comment": "string",
  "anonymous": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order rated successfully",
  "data": {
    "ratingId": "number",
    "orderId": "number",
    "rating": "number",
    "comment": "string",
    "isAnonymous": "boolean",
    "createdAt": "string"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
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

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "query": "string",
  "proximity": "string",
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
      "confidence": "number",
      "mapboxId": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Retrieve Place Details
**POST** `/addresses/retrieve`

Get detailed information about a specific place.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "mapboxId": "string",
  "sessionToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Place details retrieved successfully",
  "data": {
    "placeName": "string",
    "fullAddress": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "latitude": "number",
    "longitude": "number",
    "coordinates": {
      "latitude": "number",
      "longitude": "number"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Reverse Geocode
**POST** `/addresses/reverse-geocode`

Convert coordinates to human-readable address.

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

**Response:**
```json
{
  "success": true,
  "message": "Reverse geocoding successful",
  "data": {
    "fullAddress": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Directions
**POST** `/addresses/directions`

Get turn-by-turn directions between two points.

**Headers:**
```
Authorization: Bearer <access_token>
```

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

**Response:**
```json
{
  "success": true,
  "message": "Directions retrieved successfully",
  "data": {
    "distanceKm": "number",
    "durationMinutes": "number",
    "geometry": {
      "type": "LineString",
      "coordinates": [[number, number]]
    },
    "steps": [
      {
        "instruction": "string",
        "distance": "number",
        "duration": "number"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Calculate Distance
**POST** `/addresses/distance`

Calculate distance and duration between two points.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "lat1": "number",
  "lon1": "number",
  "lat2": "number",
  "lon2": "number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Distance calculated successfully",
  "data": {
    "distanceKm": "number",
    "durationMinutes": "number"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
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
      "description": "string",
      "pricing": {
        "baseRate": "number",
        "perKmRate": "number"
      },
      "labels": ["string"],
      "supportedVehicles": ["string"],
      "sortOrder": "number",
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
      "tierId": "number",
      "name": "string",
      "minWeightKg": "number",
      "maxWeightKg": "number",
      "additionalCharge": "number"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Vehicle Categories
**GET** `/static/vehicle-categories`

Get all available vehicle categories.

**Response:**
```json
{
  "success": true,
  "message": "Vehicle categories retrieved successfully",
  "data": [
    {
      "categoryId": "number",
      "name": "string",
      "description": "string",
      "maxWeightKg": "number",
      "icon": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Package Types
**GET** `/static/package-types`

Get all available package types.

**Response:**
```json
{
  "success": true,
  "message": "Package types retrieved successfully",
  "data": [
    {
      "packageTypeId": "number",
      "name": "string",
      "description": "string",
      "icon": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Payment Methods
**GET** `/static/payment-methods`

Get all available payment methods.

**Response:**
```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "methodId": "number",
      "name": "string",
      "displayName": "string",
      "description": "string",
      "isActive": "boolean"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Create Order Data
**GET** `/static/create-order-data`

Get all data needed for the create order screen.

**Response:**
```json
{
  "success": true,
  "message": "Create order data retrieved successfully",
  "data": {
    "deliveryTypes": [
      {
        "deliveryTypeId": "number",
        "name": "string",
        "displayName": "string",
        "description": "string",
        "pricing": {
          "baseRate": "number",
          "perKmRate": "number"
        },
        "labels": ["string"],
        "supportedVehicles": ["string"],
        "sortOrder": "number",
        "isActive": "boolean"
      }
    ],
    "packageTypes": [
      {
        "packageTypeId": "number",
        "name": "string",
        "description": "string",
        "icon": "string"
      }
    ],
    "paymentMethods": [
      {
        "methodId": "number",
        "name": "string",
        "displayName": "string",
        "description": "string",
        "isActive": "boolean"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Order Statuses
**GET** `/static/order-statuses`

Get all available order statuses.

**Response:**
```json
{
  "success": true,
  "message": "Order statuses retrieved successfully",
  "data": [
    {
      "statusId": "number",
      "name": "string",
      "description": "string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🏥 Health Check

### Health Check
**GET** `/health`

Check the health status of the API and database connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "number",
  "environment": "development" | "production",
  "database": {
    "connected": "boolean",
    "pool": {
      "totalConnections": "number",
      "idleConnections": "number",
      "waitingConnections": "number"
    }
  },
  "memory": {
    "used": "number",
    "total": "number",
    "external": "number"
  }
}
```

### API Version
**GET** `/api/v1`

Get API version information.

**Response:**
```json
{
  "name": "Shipzy API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## ❌ Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "string",
    "details": "any"
  },
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
| 503 | Service Unavailable |

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

### Role-Based Access
Some endpoints have role restrictions:
- **client**: For customers placing and managing orders
- **courier**: For drivers accepting and delivering orders

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in the local currency
- Coordinates use WGS84 decimal degrees format
- Pagination starts from page 1
- Maximum page size is 100 items
- All address and location APIs require authentication
- Static data endpoints are public and do not require authentication

---

## 🧪 Testing

For testing purposes, you can use the following endpoints:

**Health Check:**
```
GET /health
```

Returns the current status of the API and database connectivity.

**API Version:**
```
GET /api/v1
```

Returns API version information.

---

*Last updated: March 2026*
