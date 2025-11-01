# 🚀 **Shipzy Backend - Complete API Testing Guide**

> **36 Endpoints** | **6 Modules** | **Production Ready**

This comprehensive testing guide covers all 36 API endpoints across 6 modules with real cURL examples, request/response formats, and testing workflows.

---

## 📋 **Table of Contents**

1. [Setup & Prerequisites](#setup)
2. [Authentication APIs (6 endpoints)](#authentication)
3. [User Management APIs (5 endpoints)](#users)
4. [Driver Management APIs (6 endpoints)](#drivers)
5. [Order Management APIs (8 endpoints)](#orders)
6. [Address & Location APIs (5 endpoints)](#addresses)
7. [Static Data APIs (7 endpoints)](#static)
8. [Complete Testing Workflows](#workflows)
9. [Error Handling Examples](#errors)

---

<a name="setup"></a>

## 🛠️ **1. Setup & Prerequisites**

### **Environment Variables**

```bash
# Required environment variables
export BASE_URL="http://localhost:3000/api/v1"
export FIREBASE_ID_TOKEN="your_firebase_id_token_here"
export GOOGLE_ID_TOKEN="your_google_id_token_here"
export ACCESS_TOKEN="your_jwt_access_token_here"
export REFRESH_TOKEN="your_jwt_refresh_token_here"

# Test data (replace with real values)
export TEST_ORDER_ID="1"
export TEST_ADDRESS_ID="1"
export TEST_LATITUDE="19.0760"
export TEST_LONGITUDE="72.8777"
export TEST_MAPBOX_ID="dXJuOm1ieHBsYzpBc..."
export TEST_SESSION_TOKEN="1234567890_abcdef123456"
```

### **Database Setup**

```bash
# Start PostgreSQL and Redis (if using Docker)
docker-compose up -d postgres redis

# Run database migrations
npm run db:init
npm run db:functions

# Seed test data (optional)
npm run db:seed
```

### **Start Server**

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

---

<a name="authentication"></a>

## 🔐 **2. Authentication APIs (5 endpoints)**

### **2.1 Health Check**

```bash
curl -X GET "http://localhost:3000/health" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-25T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### **2.2 Google Authentication**

```bash
curl -X POST "$BASE_URL/auth/google/verify" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: device-google-789" \
  -d '{
    "idToken": "'"$GOOGLE_ID_TOKEN"'",
    "role": "client"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "isNewUser": false,
    "user": {
      "userId": 2,
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "role": "client",
      "profileComplete": true,
      "createdAt": "2025-10-25T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **2.3 User Registration**

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: device-register-123" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "role": "client",
    "phoneNumber": "+919876543210"
  }'
```

**Response (New User):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "isNewUser": true,
    "user": {
      "userId": 3,
      "userUuid": "550e8400-e29b-41d4-a716-446655440003",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+919876543210",
      "role": "client",
      "isVerified": false,
      "createdAt": "2025-10-25T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  }
}
```

### **2.4 User Login**

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: device-login-456" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "isNewUser": false,
    "user": {
      "userId": 3,
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "role": "client",
      "profileComplete": true,
      "createdAt": "2025-10-25T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **2.5 Refresh Token**

```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'"$REFRESH_TOKEN"'"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### **2.6 Logout**

```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

<a name="users"></a>

## 👤 **3. User Management APIs (5 endpoints)**

### **3.1 Get Current User Profile**

```bash
curl -X GET "$BASE_URL/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "userId": 1,
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "firebaseUid": "firebase-uid-123",
    "phoneNumber": "+919876543210",
    "fullName": "John Doe",
    "email": null,
    "role": "client",
    "isVerified": true,
    "profileComplete": true,
    "createdAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **3.2 Update User Profile**

```bash
curl -X PUT "$BASE_URL/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "fullName": "John Smith",
    "email": "john.smith@example.com"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 1,
    "fullName": "John Smith",
    "email": "john.smith@example.com",
    "updatedAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **3.3 Get Saved Addresses**

```bash
curl -X GET "$BASE_URL/users/me/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "addressId": 1,
      "addressType": "home",
      "label": "Home",
      "fullAddress": "123 Main St, Mumbai, Maharashtra 400001",
      "building": "Building A",
      "floor": "5th Floor",
      "flatNumber": "501",
      "landmark": "Near Park",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "latitude": 19.076,
      "longitude": 72.8777,
      "isDefault": true,
      "createdAt": "2025-10-25T00:00:00.000Z"
    }
  ]
}
```

### **3.4 Save New Address**

```bash
curl -X POST "$BASE_URL/users/me/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "addressType": "work",
    "label": "Office",
    "fullAddress": "456 Business Park, Andheri, Mumbai",
    "building": "Tech Tower",
    "floor": "12th Floor",
    "flatNumber": "1201",
    "landmark": "Opposite Mall",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400058",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "isDefault": false
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Address saved successfully",
  "data": {
    "addressId": 2,
    "addressType": "work",
    "label": "Office",
    "fullAddress": "456 Business Park, Andheri, Mumbai",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "isDefault": false,
    "createdAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **3.5 Delete Saved Address**

```bash
curl -X DELETE "$BASE_URL/users/me/addresses/$TEST_ADDRESS_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Address deleted successfully",
  "data": {
    "addressId": 2,
    "deleted": true
  }
}
```

---

<a name="drivers"></a>

## 🚗 **4. Driver Management APIs (6 endpoints)**

### **4.1 Get Driver Profile**

```bash
curl -X GET "$BASE_URL/drivers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "data": {
    "driverId": 1,
    "userId": 3,
    "fullName": "Jane Driver",
    "phoneNumber": "+919876543211",
    "email": "jane.driver@example.com",
    "vehicleType": "bike",
    "vehicleNumber": "MH12AB1234",
    "licenseNumber": "DL123456789",
    "isAvailable": true,
    "currentLatitude": 19.076,
    "currentLongitude": 72.8777,
    "rating": 4.8,
    "totalDeliveries": 150,
    "createdAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **4.2 Update Driver Profile**

```bash
curl -X PUT "$BASE_URL/drivers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "fullName": "Jane Smith",
    "vehicleType": "scooter",
    "vehicleNumber": "MH12CD5678"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Driver profile updated successfully",
  "data": {
    "driverId": 1,
    "fullName": "Jane Smith",
    "vehicleType": "scooter",
    "vehicleNumber": "MH12CD5678",
    "updatedAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **4.3 Toggle Availability (Online/Offline)**

```bash
curl -X PUT "$BASE_URL/drivers/me/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "isAvailable": true
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Driver availability updated successfully",
  "data": {
    "driverId": 1,
    "isAvailable": true,
    "updatedAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **4.4 Update Current Location**

```bash
curl -X PUT "$BASE_URL/drivers/me/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "latitude": 19.1136,
    "longitude": 72.8697
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Driver location updated successfully",
  "data": {
    "driverId": 1,
    "latitude": 19.1136,
    "longitude": 72.8697,
    "updatedAt": "2025-10-25T00:00:00.000Z"
  }
}
```

### **4.5 Get Active Assignments**

```bash
curl -X GET "$BASE_URL/drivers/me/assignments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Active assignments retrieved successfully",
  "data": [
    {
      "assignmentId": 1,
      "orderId": 5,
      "status": "accepted",
      "pickupAddress": "123 Main St, Mumbai",
      "deliveryAddress": "456 Park St, Mumbai",
      "pickupLatitude": 19.076,
      "pickupLongitude": 72.8777,
      "deliveryLatitude": 19.1136,
      "deliveryLongitude": 72.8697,
      "estimatedDistance": 5.2,
      "estimatedDuration": 15,
      "assignedAt": "2025-10-25T10:30:00.000Z"
    }
  ]
}
```

### **4.6 Get Earnings Summary**

```bash
curl -X GET "$BASE_URL/drivers/me/earnings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Earnings summary retrieved successfully",
  "data": {
    "driverId": 1,
    "period": "monthly",
    "totalEarnings": 2500.5,
    "totalDeliveries": 25,
    "averageRating": 4.7,
    "breakdown": {
      "baseFare": 1800.0,
      "distanceCharges": 450.0,
      "tips": 250.5,
      "bonuses": 0.0
    },
    "recentDeliveries": [
      {
        "orderId": 10,
        "date": "2025-10-24T15:30:00.000Z",
        "amount": 85.5,
        "distance": 3.2
      }
    ]
  }
}
```

---

<a name="orders"></a>

## 📦 **5. Order Management APIs (8 endpoints)**

### **5.1 Calculate Fare Estimate**

```bash
curl -X POST "$BASE_URL/orders/calculate-fare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "pickupLatitude": 19.0760,
    "pickupLongitude": 72.8777,
    "deliveryLatitude": 19.1136,
    "deliveryLongitude": 72.8697,
    "packageWeight": 2.5,
    "packageType": "documents",
    "deliveryType": "standard"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Fare calculated successfully",
  "data": {
    "baseFare": 50.0,
    "distanceFare": 25.0,
    "weightFare": 10.0,
    "totalFare": 85.0,
    "estimatedDistance": 5.2,
    "estimatedDuration": 15,
    "currency": "INR"
  }
}
```

### **5.2 Create New Order**

```bash
curl -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "pickupAddress": "123 Main St, Mumbai, Maharashtra 400001",
    "pickupLatitude": 19.0760,
    "pickupLongitude": 72.8777,
    "pickupContactName": "John Doe",
    "pickupContactPhone": "+919876543210",
    "deliveryAddress": "456 Park St, Andheri, Mumbai 400058",
    "deliveryLatitude": 19.1136,
    "deliveryLongitude": 72.8697,
    "deliveryContactName": "Jane Smith",
    "deliveryContactPhone": "+919876543211",
    "packageType": "documents",
    "packageWeight": 2.5,
    "packageDescription": "Important documents",
    "deliveryType": "standard",
    "specialInstructions": "Handle with care"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": 5,
    "orderNumber": "ORD-20251025-0005",
    "status": "pending",
    "pickupAddress": "123 Main St, Mumbai, Maharashtra 400001",
    "deliveryAddress": "456 Park St, Andheri, Mumbai 400058",
    "totalFare": 85.0,
    "estimatedDistance": 5.2,
    "estimatedDuration": 15,
    "createdAt": "2025-10-25T10:00:00.000Z"
  }
}
```

### **5.3 List User's Orders**

```bash
curl -X GET "$BASE_URL/orders?page=1&limit=10&status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": 5,
        "orderNumber": "ORD-20251025-0005",
        "status": "pending",
        "pickupAddress": "123 Main St, Mumbai",
        "deliveryAddress": "456 Park St, Andheri",
        "totalFare": 85.0,
        "createdAt": "2025-10-25T10:00:00.000Z",
        "estimatedDeliveryTime": "2025-10-25T10:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **5.4 List Available Orders (For Drivers)**

```bash
curl -X GET "$BASE_URL/orders/available?latitude=19.0760&longitude=72.8777&radius=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Available orders retrieved successfully",
  "data": [
    {
      "orderId": 5,
      "orderNumber": "ORD-20251025-0005",
      "pickupAddress": "123 Main St, Mumbai",
      "deliveryAddress": "456 Park St, Andheri",
      "distance": 5.2,
      "fare": 85.0,
      "estimatedDuration": 15,
      "createdAt": "2025-10-25T10:00:00.000Z"
    }
  ]
}
```

### **5.5 Get Order Details**

```bash
curl -X GET "$BASE_URL/orders/$TEST_ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "orderId": 5,
    "orderNumber": "ORD-20251025-0005",
    "status": "accepted",
    "pickupAddress": "123 Main St, Mumbai, Maharashtra 400001",
    "pickupLatitude": 19.076,
    "pickupLongitude": 72.8777,
    "pickupContactName": "John Doe",
    "pickupContactPhone": "+919876543210",
    "deliveryAddress": "456 Park St, Andheri, Mumbai 400058",
    "deliveryLatitude": 19.1136,
    "deliveryLongitude": 72.8697,
    "deliveryContactName": "Jane Smith",
    "deliveryContactPhone": "+919876543211",
    "packageType": "documents",
    "packageWeight": 2.5,
    "packageDescription": "Important documents",
    "totalFare": 85.0,
    "estimatedDistance": 5.2,
    "estimatedDuration": 15,
    "driverId": 1,
    "driverName": "Jane Driver",
    "driverPhone": "+919876543211",
    "createdAt": "2025-10-25T10:00:00.000Z",
    "acceptedAt": "2025-10-25T10:02:00.000Z"
  }
}
```

### **5.6 Cancel Order**

```bash
curl -X POST "$BASE_URL/orders/$TEST_ORDER_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "reason": "Changed my mind"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "orderId": 5,
    "status": "cancelled",
    "cancelledAt": "2025-10-25T10:05:00.000Z",
    "cancellationReason": "Changed my mind"
  }
}
```

### **5.7 Accept Order (Driver)**

```bash
curl -X POST "$BASE_URL/orders/$TEST_ORDER_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": 5,
    "status": "accepted",
    "driverId": 1,
    "acceptedAt": "2025-10-25T10:02:00.000Z"
  }
}
```

### **5.8 Update Order Status (Driver)**

```bash
curl -X PUT "$BASE_URL/orders/$TEST_ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "picked_up",
    "notes": "Package collected successfully"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 5,
    "status": "picked_up",
    "updatedAt": "2025-10-25T10:10:00.000Z",
    "notes": "Package collected successfully"
  }
}
```

---

<a name="addresses"></a>

## 🗺️ **6. Address & Location APIs (5 endpoints)**

### **6.1 Search Places (Step 1 - Get Suggestions)**

```bash
curl -X POST "$BASE_URL/addresses/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "Connaught Place",
    "proximity": "77.2167,28.6139",
    "limit": 5
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Found 3 suggestions for \"Connaught Place\"",
  "data": [
    {
      "id": "dXJuOm1ieHBsYzpBc...",
      "name": "Connaught Place",
      "fullAddress": "Connaught Place, New Delhi, Delhi 110001, India",
      "placeType": "place",
      "coordinates": {
        "latitude": 28.6139,
        "longitude": 77.2167
      },
      "context": {
        "locality": "New Delhi",
        "region": "Delhi",
        "country": "India"
      },
      "sessionToken": "1234567890_abcdef123456"
    }
  ]
}
```

### **6.2 Retrieve Place Details (Step 2)**

```bash
curl -X POST "$BASE_URL/addresses/retrieve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "mapboxId": "'"$TEST_MAPBOX_ID"'",
    "sessionToken": "'"$TEST_SESSION_TOKEN"'"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Place details retrieved successfully",
  "data": {
    "id": "dXJuOm1ieHBsYzpBc...",
    "name": "Connaught Place",
    "fullAddress": "Connaught Place, New Delhi, Delhi 110001, India",
    "coordinates": {
      "latitude": 28.6139,
      "longitude": 77.2167
    },
    "context": {
      "locality": "New Delhi",
      "region": "Delhi",
      "country": "India"
    },
    "featureType": "Point",
    "bbox": [77.2167, 28.6139, 77.2167, 28.6139]
  }
}
```

### **6.3 Reverse Geocode (Coordinates to Address)**

```bash
curl -X POST "$BASE_URL/addresses/reverse-geocode" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2167
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Reverse geocode completed for (77.2167, 28.6139)",
  "data": {
    "coordinates": {
      "longitude": 77.2167,
      "latitude": 28.6139
    },
    "results": [
      {
        "id": "address.123",
        "name": "Connaught Place",
        "fullAddress": "Connaught Place, New Delhi, Delhi 110001, India",
        "placeName": "Connaught Place, New Delhi, Delhi 110001, India",
        "coordinates": {
          "longitude": 77.2167,
          "latitude": 28.6139
        },
        "featureType": "address",
        "properties": {},
        "context": [
          {
            "id": "neighborhood.123",
            "text": "Connaught Place"
          }
        ],
        "bbox": [77.216, 28.613, 77.218, 28.615],
        "relevance": 1
      }
    ],
    "total": 1
  }
}
```

### **6.4 Get Directions Between Points**

```bash
curl -X POST "$BASE_URL/addresses/directions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "origin": {
      "latitude": 28.6139,
      "longitude": 77.2167
    },
    "destination": {
      "latitude": 28.7041,
      "longitude": 77.1025
    },
    "profile": "driving"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Directions calculated: 1425.00km, 150min",
  "data": {
    "distance": 1425000,
    "duration": 9000,
    "geometry": "geojson_linestring...",
    "distanceKm": "1425.00",
    "durationMinutes": 150,
    "origin": {
      "latitude": 28.6139,
      "longitude": 77.2167
    },
    "destination": {
      "latitude": 28.7041,
      "longitude": 77.1025
    }
  }
}
```

### **6.5 Calculate Distance Between Coordinates**

```bash
curl -X POST "$BASE_URL/addresses/distance" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "lat1": 28.6139,
    "lon1": 77.2167,
    "lat2": 28.7041,
    "lon2": 77.1025
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Distance calculated: 15.23km",
  "data": {
    "distanceKm": 15.23
  }
}
```

---

<a name="static"></a>

## 📊 **7. Static Data APIs (7 endpoints)**

### **7.1 Get Delivery Types**

```bash
curl -X GET "$BASE_URL/static/delivery-types" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Delivery types retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "standard",
      "displayName": "Standard Delivery",
      "description": "Delivery within 2-4 hours",
      "baseFare": 50.0,
      "perKmRate": 15.0,
      "estimatedDuration": "2-4 hours",
      "isActive": true
    },
    {
      "id": 2,
      "name": "express",
      "displayName": "Express Delivery",
      "description": "Delivery within 1-2 hours",
      "baseFare": 80.0,
      "perKmRate": 20.0,
      "estimatedDuration": "1-2 hours",
      "isActive": true
    }
  ]
}
```

### **7.2 Get Weight Tiers**

```bash
curl -X GET "$BASE_URL/static/weight-tiers" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Weight tiers retrieved successfully",
  "data": [
    {
      "tierId": 1,
      "name": "Light",
      "minWeightKg": 0.1,
      "maxWeightKg": 2.0,
      "additionalCharge": 0.0
    },
    {
      "tierId": 2,
      "name": "Medium",
      "minWeightKg": 2.1,
      "maxWeightKg": 5.0,
      "additionalCharge": 20.0
    }
  ]
}
```

### **7.3 Get Vehicle Categories**

```bash
curl -X GET "$BASE_URL/static/vehicle-categories" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Vehicle categories retrieved successfully",
  "data": [
    {
      "categoryId": 1,
      "name": "bike",
      "description": "Motorcycle/Bike delivery",
      "maxWeightKg": 10.0,
      "icon": "motorcycle"
    },
    {
      "categoryId": 2,
      "name": "scooter",
      "description": "Electric scooter delivery",
      "maxWeightKg": 8.0,
      "icon": "scooter"
    }
  ]
}
```

### **7.4 Get Package Types**

```bash
curl -X GET "$BASE_URL/static/package-types" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Package types retrieved successfully",
  "data": [
    {
      "packageTypeId": 1,
      "name": "documents",
      "description": "Documents and small items",
      "icon": "document"
    },
    {
      "packageTypeId": 2,
      "name": "food",
      "description": "Food delivery",
      "icon": "food"
    }
  ]
}
```

### **7.5 Get Payment Methods**

```bash
curl -X GET "$BASE_URL/static/payment-methods" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "methodId": 1,
      "name": "cash",
      "displayName": "Cash on Delivery",
      "description": "Pay cash when package is delivered",
      "isActive": true
    },
    {
      "methodId": 2,
      "name": "wallet",
      "displayName": "Wallet",
      "description": "Pay using wallet balance",
      "isActive": true
    }
  ]
}
```

### **7.6 Get Order Statuses**

```bash
curl -X GET "$BASE_URL/static/order-statuses" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Order statuses retrieved successfully",
  "data": [
    {
      "statusId": 1,
      "name": "pending",
      "description": "Order created, waiting for driver assignment"
    },
    {
      "statusId": 2,
      "name": "accepted",
      "description": "Driver has accepted the order"
    },
    {
      "statusId": 3,
      "name": "picked_up",
      "description": "Package has been picked up by driver"
    },
    {
      "statusId": 4,
      "name": "in_transit",
      "description": "Package is on the way to delivery"
    },
    {
      "statusId": 5,
      "name": "delivered",
      "description": "Package has been delivered successfully"
    },
    {
      "statusId": 6,
      "name": "cancelled",
      "description": "Order has been cancelled"
    }
  ]
}
```

### **7.7 Get Create Order Data (Combined)**

```bash
curl -X GET "$BASE_URL/static/create-order-data" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Create order data retrieved successfully",
  "data": {
    "deliveryTypes": [...],
    "weightTiers": [...],
    "vehicleCategories": [...],
    "packageTypes": [...],
    "paymentMethods": [...]
  }
}
```

---

<a name="workflows"></a>

## 🔄 **9. Complete Testing Workflows**

### **Client Journey: Order Creation**

```bash
# 1. Authenticate
curl -X POST "$BASE_URL/auth/google/verify" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'"$GOOGLE_ID_TOKEN"'", "role": "client"}'

# 2. Get profile
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Search pickup location
curl -X POST "$BASE_URL/addresses/search" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "Connaught Place", "limit": 3}'

# 4. Get location details
curl -X POST "$BASE_URL/addresses/retrieve" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"mapboxId": "'"$MAPBOX_ID"'", "sessionToken": "'"$SESSION_TOKEN"'"}'

# 5. Calculate fare
curl -X POST "$BASE_URL/orders/calculate-fare" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"pickupLatitude": 28.6139, "pickupLongitude": 77.2167, "deliveryLatitude": 28.7041, "deliveryLongitude": 77.1025}'

# 6. Create order
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"pickupAddress": "Connaught Place", "pickupLatitude": 28.6139, "pickupLongitude": 77.2167, "deliveryAddress": "Karol Bagh", "deliveryLatitude": 28.7041, "deliveryLongitude": 77.1025, "packageType": "documents"}'

# 7. Track order
curl -X GET "$BASE_URL/orders/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### **Driver Journey: Order Fulfillment**

```bash
# 1. Authenticate as driver
curl -X POST "$BASE_URL/auth/google/verify" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "'"$GOOGLE_ID_TOKEN"'", "role": "courier"}'

# 2. Go online
curl -X PUT "$BASE_URL/drivers/me/availability" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"isAvailable": true}'

# 3. Get available orders
curl -X GET "$BASE_URL/orders/available?latitude=28.6139&longitude=77.2167" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Accept order
curl -X POST "$BASE_URL/orders/1/accept" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5. Update location
curl -X PUT "$BASE_URL/drivers/me/location" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"latitude": 28.6139, "longitude": 77.2167}'

# 6. Update status to picked up
curl -X PUT "$BASE_URL/orders/1/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"status": "picked_up"}'

# 7. Get directions to delivery
curl -X POST "$BASE_URL/addresses/directions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"origin": {"latitude": 28.6139, "longitude": 77.2167}, "destination": {"latitude": 28.7041, "longitude": 77.1025}}'

# 8. Complete delivery
curl -X PUT "$BASE_URL/orders/1/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"status": "delivered"}'

# 9. Check earnings
curl -X GET "$BASE_URL/drivers/me/earnings" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

<a name="errors"></a>

## ⚠️ **9. Error Handling Examples**

### **Authentication Errors**

```bash
# Invalid token
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer invalid_token"
```

**Response:**

```json
{
  "success": false,
  "message": "Authentication failed",
  "error": "Invalid or expired token",
  "statusCode": 401
}
```

### **Validation Errors**

```bash
# Missing required fields
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{}'
```

**Response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "pickupAddress is required",
  "statusCode": 400
}
```

### **Not Found Errors**

```bash
# Order not found
curl -X GET "$BASE_URL/orders/99999" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": false,
  "message": "Order not found",
  "error": "No order found with ID 99999",
  "statusCode": 404
}
```

### **Business Logic Errors**

```bash
# Insufficient balance
curl -X POST "$BASE_URL/orders" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"pickupAddress": "A", "deliveryAddress": "B", "totalFare": 1000}'
```

**Response:**

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "error": "Wallet balance (₹150) is less than order amount (₹1000)",
  "statusCode": 402
}
```

---

## 🎯 **Quick Test Script**

Create a file `test-all.sh`:

```bash
#!/bin/bash

# Load environment variables
source .env

echo "🧪 Starting Shipzy API Tests..."
echo "================================="

# Health check
echo "1. Health Check:"
curl -s -X GET "$BASE_URL/../health" | jq '.status'

# Authentication test
echo "2. Google Authentication:"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/google/verify" \
  -H "Content-Type: application/json" \
  -d "{\"idToken\": \"$GOOGLE_ID_TOKEN\", \"role\": \"client\"}")

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
echo "Token received: ${ACCESS_TOKEN:0:50}..."

# User profile test
echo "3. Get User Profile:"
curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.success'

echo "✅ All basic tests completed!"
```

Make executable and run:

```bash
chmod +x test-all.sh
./test-all.sh
```

---

## 📝 **Testing Checklist**

- [ ] Environment variables configured
- [ ] PostgreSQL database running
- [ ] Firebase project configured
- [ ] Mapbox token configured
- [ ] Server starts without errors
- [ ] Health check passes
- [ ] Authentication works
- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Rate limiting functions
- [ ] CORS configured properly

---

## 🔗 **Related Documentation**

- [API Reference](../../docs/api/swagger.yaml)
- [Database Schema](../../src/database/init/schema.sql)
- [Environment Setup](../../README.md#environment-variables)
- [Deployment Guide](../../docs/deployment/production-guide.md)

---

**🚀 Happy Testing!** Test all endpoints thoroughly before deploying to production.
