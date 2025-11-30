# Driver Home Screen - API Request/Response Samples

This document provides sample request and response JSONs for all APIs used in the driver home screen implementation, based on the updated backend structure.

## Table of Contents

1. [Driver Profile](#1-driver-profile)
2. [Driver Availability](#2-driver-availability)
3. [Driver Location](#3-driver-location)
4. [Driver Earnings](#4-driver-earnings)
5. [Available Orders](#5-available-orders)
6. [Active Assignments](#6-active-assignments)
7. [Accept Order](#7-accept-order)
8. [Update Order Status](#8-update-order-status)

---

## 1. Driver Profile

### `GET /api/v1/drivers/me`

**Request:**

```http
GET /api/v1/drivers/me
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "data": {
    "userId": 123,
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+919876543210",
    "fullName": "Amit Kumar",
    "email": "amit.kumar@example.com",
    "profilePictureUrl": "https://storage.example.com/profiles/amit.jpg",
    "isVerified": true,
    "isActive": true,
    "status": {
      "isAvailable": false,
      "isOnline": false,
      "totalDeliveriesToday": 5,
      "lastLocationUpdate": "2024-01-15T14:30:00Z",
      "currentLocation": {
        "latitude": 19.076,
        "longitude": 72.8777
      }
    },
    "vehicle": {
      "vehicleId": 45,
      "vehicleNumber": "MH-01-AB-1234",
      "model": "Honda Activa",
      "year": 2022,
      "category": "2_wheeler",
      "capacity": 20
    },
    "earnings": {
      "total": 12500.5,
      "today": 425.0,
      "thisWeek": 1850.75,
      "thisMonth": 5200.25,
      "averageOrderValue": 145.5,
      "totalDistanceKm": 1250.5
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

---

## 2. Driver Availability

### `PUT /api/v1/drivers/me/availability`

**Request:**

```http
PUT /api/v1/drivers/me/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "isAvailable": true,
  "isOnline": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "courierId": 123,
    "isAvailable": true,
    "isOnline": true,
    "updatedAt": "2024-01-15T15:00:00Z"
  }
}
```

**Request (Go Offline):**

```json
{
  "isAvailable": false,
  "isOnline": false
}
```

---

## 3. Driver Location

### `PUT /api/v1/drivers/me/location`

**Request:**

```http
PUT /api/v1/drivers/me/location
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "courierId": 123,
    "latitude": 19.076,
    "longitude": 72.8777,
    "lastLocationUpdate": "2024-01-15T15:05:00Z"
  }
}
```

---

## 4. Driver Earnings

### `GET /api/v1/drivers/me/earnings`

**Request:**

```http
GET /api/v1/drivers/me/earnings
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Earnings retrieved successfully",
  "data": {
    "deliveries": {
      "total": 86,
      "today": 5,
      "thisWeek": 12,
      "thisMonth": 35
    },
    "earnings": {
      "total": 12500.5,
      "today": 425.0,
      "thisWeek": 1850.75,
      "thisMonth": 5200.25,
      "averageOrderValue": 145.5
    },
    "totalDistanceKm": 1250.5
  }
}
```

---

## 5. Available Orders

### `GET /api/v1/orders/available`

**Request:**

```http
GET /api/v1/orders/available?latitude=19.0760&longitude=72.8777&radius=10&limit=20
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Available orders retrieved successfully",
  "data": [
    {
      "orderId": 456,
      "orderUuid": "660e8400-e29b-41d4-a716-446655440001",
      "orderNumber": "ORD-20240115-000456",
      "deliveryType": "deliver_now",
      "deliveryTypeDisplay": "Deliver Now",
      "vehicleCategory": "2_wheeler",
      "vehicleCategoryDisplay": "2-Wheeler (Bike)",
      "packageType": "Document",
      "weightTier": {
        "id": 2,
        "name": "1-5 kg",
        "minWeightKg": 1.0,
        "maxWeightKg": 5.0
      },
      "pricing": {
        "basePrice": 50.0,
        "distancePrice": 64.0,
        "weightSurcharge": 10.0,
        "platformFee": 10.0,
        "specialHandlingFee": 0.0,
        "gstAmount": 22.0,
        "subtotalBeforeTax": 134.0,
        "totalPrice": 156.0
      },
      "packageDescription": "Important documents",
      "specialInstructions": "Handle with care",
      "estimatedDistanceKm": 12.5,
      "createdAt": "2024-01-15T14:45:00Z",
      "pickup": {
        "address": "Lokhandwala Complex, Andheri West",
        "landmark": "Near Metro Station",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.1364,
        "longitude": 72.8296
      },
      "delivery": {
        "address": "Phoenix Mall, Bandra East",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "distanceFromCourierKm": 2.3
    },
    {
      "orderId": 457,
      "orderUuid": "660e8400-e29b-41d4-a716-446655440002",
      "orderNumber": "ORD-20240115-000457",
      "deliveryType": "scheduled",
      "deliveryTypeDisplay": "Scheduled Pickup",
      "vehicleCategory": "2_wheeler",
      "vehicleCategoryDisplay": "2-Wheeler (Bike)",
      "packageType": "Food",
      "weightTier": {
        "id": 1,
        "name": "0-1 kg",
        "minWeightKg": 0.0,
        "maxWeightKg": 1.0
      },
      "pricing": {
        "basePrice": 40.0,
        "distancePrice": 47.6,
        "weightSurcharge": 0.0,
        "platformFee": 10.0,
        "specialHandlingFee": 15.0,
        "gstAmount": 20.27,
        "subtotalBeforeTax": 112.6,
        "totalPrice": 132.87
      },
      "packageDescription": "Food delivery",
      "specialInstructions": null,
      "estimatedDistanceKm": 6.8,
      "createdAt": "2024-01-15T14:50:00Z",
      "pickup": {
        "address": "Goregaon East",
        "landmark": "Near Railway Station",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.1658,
        "longitude": 72.857
      },
      "delivery": {
        "address": "Malad West",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "distanceFromCourierKm": 5.1
    }
  ]
}
```

**Empty Response (No Orders):**

```json
{
  "success": true,
  "message": "Available orders retrieved successfully",
  "data": []
}
```

---

## 6. Active Assignments

### `GET /api/v1/drivers/me/assignments`

**Request:**

```http
GET /api/v1/drivers/me/assignments
Authorization: Bearer <jwt_token>
```

**Response (With Active Order):**

```json
{
  "success": true,
  "message": "Active assignments retrieved successfully",
  "data": [
    {
      "assignmentId": 789,
      "orderId": 456,
      "orderUuid": "660e8400-e29b-41d4-a716-446655440001",
      "orderNumber": "ORD-20240115-000456",
      "orderStatus": "accepted",
      "assignmentStatus": "accepted",
      "vehicleCategory": "2_wheeler",
      "vehicleCategoryDisplay": "2-Wheeler (Bike)",
      "packageType": "Document",
      "weightTier": {
        "id": 2,
        "name": "1-5 kg",
        "minWeightKg": 1.0,
        "maxWeightKg": 5.0
      },
      "pickup": {
        "address": "Lokhandwala Complex, Andheri West",
        "building": "Building A",
        "landmark": "Near Metro Station",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400053",
        "latitude": 19.1364,
        "longitude": 72.8296,
        "contactName": "Rahul Sharma",
        "contactPhone": "+919876543210"
      },
      "delivery": {
        "address": "Phoenix Mall, Bandra East",
        "building": "Ground Floor",
        "landmark": "Main Entrance",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400051",
        "latitude": 19.0606,
        "longitude": 72.835,
        "contactName": "Priya Sharma",
        "contactPhone": "+919811122333"
      },
      "packageDescription": "Important documents",
      "specialInstructions": "Please call on arrival",
      "declaredValue": 5000.0,
      "estimatedDistanceKm": 12.5,
      "actualDistanceKm": null,
      "driverEarnings": 85.0,
      "earningsBreakdown": {
        "basePayout": 35,
        "distanceEarning": 65,
        "weightCompensation": 0,
        "peakHourBonus": 5,
        "urgencyBonus": 0,
        "onTimeBonus": 2,
        "qualityBonus": 5,
        "platformCommission": 15,
        "customerTip": 0,
        "grossEarning": 117,
        "netEarning": 85
      },
      "estimatedDeliveryTime": 30,
      "assignedAt": "2024-01-15T15:00:00Z",
      "acceptedAt": "2024-01-15T15:01:00Z"
    }
  ]
}
```

**Response (No Active Orders):**

```json
{
  "success": true,
  "message": "Active assignments retrieved successfully",
  "data": []
}
```

---

## 7. Accept Order

### `POST /api/v1/orders/{id}/accept`

**Request:**

```http
POST /api/v1/orders/456/accept
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "assignmentId": 789,
    "orderId": 456,
    "acceptedAt": "2024-01-15T15:01:00Z"
  }
}
```

**Error Response (Order Already Taken):**

```json
{
  "success": false,
  "message": "Order already assigned to another driver",
  "error": "ORDER_ALREADY_ASSIGNED",
  "statusCode": 409
}
```

**Error Response (Order Not Found):**

```json
{
  "success": false,
  "message": "Order not found",
  "error": "ORDER_NOT_FOUND",
  "statusCode": 404
}
```

---

## 8. Update Order Status

### `PUT /api/v1/orders/{id}/status`

**Request (Mark as Picked Up):**

```http
PUT /api/v1/orders/456/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "picked_up"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 456,
    "status": "picked_up",
    "pickedUpAt": "2024-01-15T15:30:00Z"
  }
}
```

**Request (Mark as Delivered):**

```json
{
  "status": "delivered"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 456,
    "status": "delivered",
    "deliveredAt": "2024-01-15T16:00:00Z"
  }
}
```

**Error Response (Invalid Status):**

```json
{
  "success": false,
  "message": "Invalid status. Allowed values: picked_up, delivered",
  "error": "VALIDATION_ERROR",
  "statusCode": 400
}
```

---

## Field Mapping Notes

### Weight Tier Object

The `weightTier` object replaces the non-existent `packageWeightKg` field:

```json
{
  "id": 2,
  "name": "1-5 kg",
  "minWeightKg": 1.0,
  "maxWeightKg": 5.0
}
```

### Driver Earnings for Order

Instead of customer pricing breakdown, show driver's earnings for this specific order:

```json
{
  "driverEarnings": 120.0,
  "estimatedDeliveryTime": 25,
  "priority": "high"
}
```

**Business Logic:**

- Driver earnings = Customer total × Driver commission rate (typically 70-85%)
- `estimatedDeliveryTime` = Distance ÷ Average speed (25 km/h) × 60 minutes
- Platform fees and payment processing costs are deducted from customer total before calculating driver earnings
- No customer pricing details are exposed to drivers for privacy

**Why this change:**

- **Privacy**: Customer pricing details shouldn't be shared with drivers
- **Relevance**: Drivers care about their earnings, not customer pricing
- **Motivation**: Shows potential earnings for order acceptance decisions
- **Simplicity**: Less cluttered UI, clearer driver-focused information

### Distance Fields

- `distanceFromCourierKm`: PostGIS straight-line distance (driver → pickup)
- `estimatedDistanceKm`: Mapbox road distance (pickup → delivery, stored during order creation)
- `actualDistanceKm`: Actual distance traveled (updated after delivery)

### Assignment Status Values

- `assigned`: Order assigned to courier
- `accepted`: Courier accepted assignment
- `picked_up`: Package picked up
- `in_transit`: Package in transit
- `delivered`: Package delivered
- `cancelled`: Assignment cancelled
- `rejected`: Courier rejected assignment

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

Common status codes:

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (e.g., order already assigned)
- `500`: Internal Server Error

---

## Testing Examples

### Complete Flow: Going Online → Viewing Orders → Accepting Order

1. **Go Online:**

```http
PUT /api/v1/drivers/me/availability
{"isAvailable": true, "isOnline": true}
```

2. **Update Location:**

```http
PUT /api/v1/drivers/me/location
{"latitude": 19.0760, "longitude": 72.8777}
```

3. **Get Available Orders:**

```http
GET /api/v1/orders/available?latitude=19.0760&longitude=72.8777&radius=10
```

4. **Accept Order:**

```http
POST /api/v1/orders/456/accept
```

5. **Get Active Assignment:**

```http
GET /api/v1/drivers/me/assignments
```

6. **Update Status (Picked Up):**

```http
PUT /api/v1/orders/456/status
{"status": "picked_up"}
```

7. **Update Status (Delivered):**

```http
PUT /api/v1/orders/456/status
{"status": "delivered"}
```

8. **Go Offline:**

```http
PUT /api/v1/drivers/me/availability
{"isAvailable": false, "isOnline": false}
```

---

## 9. Order Creation Impact

### How Order Creation Affects Drivers

When users create orders through the user app, the enhanced pricing calculation affects what drivers see in their available orders and active assignments.

#### **Enhanced Order Creation Response** (User App)

When a user creates an order, the response now includes the full pricing breakdown:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": 456,
    "orderUuid": "660e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-20240115-000456",
    "status": "pending",
    "pricing": {
      "basePrice": 50.0,
      "distanceKm": 8.5,
      "distancePrice": 68.0,
      "weightSurcharge": 10.0,
      "platformFee": 10.0,
      "specialHandlingFee": 25.0,
      "subtotalBeforeTax": 163.0,
      "gstAmount": 29.34,
      "totalPrice": 192.34,
      "currency": "INR"
    },
    "createdAt": "2024-01-15T14:45:00Z"
  }
}
```

#### **Driver Impact**

The pricing breakdown stored in the database affects:

1. **Available Orders**: Drivers see orders with the total customer price
2. **Driver Earnings**: Platform calculates driver compensation based on the stored pricing components
3. **Transparency**: Both users and drivers can see detailed fare breakdowns

#### **Key Components Stored:**

- `platform_fee`: Fixed fee added to every order
- `special_handling_fee`: Package-type specific fees (electronics, food, etc.)
- `gst_amount`: GST calculated on taxable amount
- `total_before_tax`: Subtotal before GST
- `total_price`: Final amount customer pays

#### **Driver Earnings Calculation:**

```
Driver Earnings = (Base Price × Commission Rate) +
                 (Distance Price × Distance Rate) +
                 (Weight Surcharge × Weight Rate) +
                 Peak Hour Bonus +
                 Urgency Bonus +
                 Quality Bonus -
                 Platform Commission
```

This ensures fair compensation while maintaining transparency for both users and drivers.
