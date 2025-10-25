<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Yes can you provide complete testing documentation with cURL examples?

Perfect! Let me provide you with comprehensive testing documentation with cURL examples for all 25 API endpoints.

***

# 🧪 **Complete API Testing Documentation**

## **Table of Contents**

1. [Setup \& Prerequisites](#setup)
2. [Authentication APIs](#authentication)
3. [User Management APIs](#users)
4. [Driver Management APIs](#drivers)
5. [Order Management APIs](#orders)
6. [Static Data APIs](#static)
7. [Complete User Journey Examples](#journeys)
8. [Error Handling Examples](#errors)

***

<a name="setup"></a>

## 📋 **1. Setup \& Prerequisites**

### **Environment Variables**

```bash
export BASE_URL="http://localhost:3000/api/v1"
export FIREBASE_ID_TOKEN="your_firebase_id_token_here"
export ACCESS_TOKEN="your_jwt_access_token_here"
export REFRESH_TOKEN="your_jwt_refresh_token_here"
```


### **Test Data Setup**

```bash
# Set test variables
export TEST_ORDER_ID=1
export TEST_ADDRESS_ID=1
export TEST_LATITUDE=19.0760
export TEST_LONGITUDE=72.8777
```


***

<a name="authentication"></a>

## 🔐 **2. Authentication APIs**

### **2.1. Health Check**

```bash
curl -X GET "$BASE_URL/../health" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-11T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```


***

### **2.2. Verify Firebase Token \& Create/Login User (Client)**

**New User Registration:**

```bash
curl -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: device-123-456" \
  -d '{
    "idToken": "'"$FIREBASE_ID_TOKEN"'",
    "fullName": "John Doe",
    "role": "client"
  }'
```

**Expected Response (New User):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "isNewUser": true,
    "user": {
      "userId": 1,
      "userUuid": "550e8400-e29b-41d4-a716-446655440000",
      "firebaseUid": "firebase-uid-123",
      "phoneNumber": "+919876543210",
      "fullName": "John Doe",
      "email": null,
      "role": "client",
      "isVerified": true,
      "createdAt": "2025-10-11T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  },
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```

**Save the access token:**

```bash
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```


***

### **2.3. Verify Firebase Token \& Create/Login User (Courier)**

```bash
curl -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: courier-device-789" \
  -d '{
    "idToken": "'"$FIREBASE_ID_TOKEN"'",
    "fullName": "Jane Driver",
    "role": "courier"
  }'
```


***

### **2.4. Existing User Login**

```bash
curl -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: device-123-456" \
  -d '{
    "idToken": "'"$FIREBASE_ID_TOKEN"'"
  }'
```

**Expected Response (Existing User):**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "isNewUser": false,
    "user": {
      "userId": 1,
      "userUuid": "550e8400-e29b-41d4-a716-446655440000",
      "phoneNumber": "+919876543210",
      "fullName": "John Doe",
      "role": "client",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  }
}
```


***

### **2.5. Refresh Access Token**

```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'"$REFRESH_TOKEN"'"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

### **2.6. Logout**

```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

<a name="users"></a>

## 👤 **3. User Management APIs**

### **3.1. Get Current User Profile**

```bash
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "userId": 1,
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "role": "client",
    "phoneNumber": "+919876543210",
    "email": "john@example.com",
    "fullName": "John Doe",
    "profilePictureUrl": "https://example.com/photo.jpg",
    "isVerified": true,
    "isActive": true,
    "createdAt": "2025-10-11T00:00:00.000Z",
    "updatedAt": "2025-10-11T00:00:00.000Z"
  }
}
```


***

### **3.2. Update User Profile**

```bash
curl -X PUT "$BASE_URL/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "fullName": "John Michael Doe",
    "email": "john.doe@example.com",
    "profilePictureUrl": "https://example.com/new-photo.jpg"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": 1,
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Michael Doe",
    "email": "john.doe@example.com",
    "profilePictureUrl": "https://example.com/new-photo.jpg",
    "updatedAt": "2025-10-11T00:10:00.000Z"
  }
}
```


***

### **3.3. Get Saved Addresses**

```bash
curl -X GET "$BASE_URL/users/me/addresses" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "addressId": 1,
      "addressType": "home",
      "label": "Home",
      "fullAddress": "123 Main Street, Andheri West",
      "building": "Sunrise Apartments",
      "floor": "5",
      "flatNumber": "501",
      "landmark": "Near Railway Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400058",
      "latitude": 19.1136,
      "longitude": 72.8697,
      "isDefault": true,
      "createdAt": "2025-10-11T00:00:00.000Z"
    },
    {
      "addressId": 2,
      "addressType": "work",
      "label": "Office",
      "fullAddress": "456 Corporate Park, BKC",
      "building": "Tower A",
      "floor": "12",
      "flatNumber": "1205",
      "landmark": "Near BKC Metro Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400051",
      "latitude": 19.0596,
      "longitude": 72.8656,
      "isDefault": false,
      "createdAt": "2025-10-11T00:05:00.000Z"
    }
  ]
}
```


***

### **3.4. Save New Address**

```bash
curl -X POST "$BASE_URL/users/me/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "addressType": "home",
    "label": "Home",
    "fullAddress": "123 Main Street, Andheri West, Mumbai",
    "building": "Sunrise Apartments",
    "floor": "5",
    "flatNumber": "501",
    "landmark": "Near Railway Station",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400058",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "isDefault": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Address saved successfully",
  "data": {
    "addressId": 1,
    "label": "Home",
    "fullAddress": "123 Main Street, Andheri West, Mumbai",
    "isDefault": true,
    "createdAt": "2025-10-11T00:00:00.000Z"
  }
}
```


***

### **3.5. Delete Address**

```bash
curl -X DELETE "$BASE_URL/users/me/addresses/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Address deleted successfully",
  "data": {
    "message": "Address deleted successfully"
  }
}
```


***

<a name="drivers"></a>

## 🚗 **4. Driver Management APIs**

### **4.1. Get Driver Profile**

```bash
curl -X GET "$BASE_URL/drivers/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Driver profile retrieved successfully",
  "data": {
    "userId": 2,
    "userUuid": "660e8400-e29b-41d4-a716-446655440001",
    "phoneNumber": "+919876543211",
    "fullName": "Jane Driver",
    "email": "jane@example.com",
    "profilePictureUrl": "https://example.com/jane.jpg",
    "isVerified": true,
    "isActive": true,
    "status": {
      "isAvailable": true,
      "isOnline": true,
      "totalDeliveriesToday": 5,
      "lastLocationUpdate": "2025-10-11T00:00:00.000Z",
      "currentLocation": {
        "latitude": 19.0760,
        "longitude": 72.8777
      }
    },
    "vehicle": {
      "vehicleId": 1,
      "vehicleNumber": "MH-02-AB-1234",
      "model": "Honda Activa",
      "year": 2022,
      "category": "2-wheeler",
      "maxWeightKg": 20
    }
  }
}
```


***

### **4.2. Update Driver Profile**

```bash
curl -X PUT "$BASE_URL/drivers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "fullName": "Jane Susan Driver",
    "email": "jane.driver@example.com"
  }'
```


***

### **4.3. Update Availability (Go Online/Offline)**

```bash
curl -X PUT "$BASE_URL/drivers/me/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "isAvailable": true,
    "isOnline": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "courierId": 2,
    "isAvailable": true,
    "isOnline": true,
    "updatedAt": "2025-10-11T00:15:00.000Z"
  }
}
```


***

### **4.4. Update Driver Location**

```bash
curl -X PUT "$BASE_URL/drivers/me/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "courierId": 2,
    "latitude": 19.0760,
    "longitude": 72.8777,
    "lastLocationUpdate": "2025-10-11T00:20:00.000Z"
  }
}
```


***

### **4.5. Get Active Assignments**

```bash
curl -X GET "$BASE_URL/drivers/me/assignments" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Active assignments retrieved successfully",
  "data": [
    {
      "assignmentId": 1,
      "orderId": 1,
      "orderUuid": "770e8400-e29b-41d4-a716-446655440002",
      "orderNumber": "SZ001000",
      "orderStatus": "assigned",
      "assignmentStatus": "accepted",
      "pickup": {
        "address": "123 Main Street, Andheri West",
        "building": "Sunrise Apartments",
        "landmark": "Near Railway Station",
        "latitude": 19.1136,
        "longitude": 72.8697,
        "contactName": "John Doe",
        "contactPhone": "+919876543210"
      },
      "delivery": {
        "address": "456 Corporate Park, BKC",
        "building": "Tower A",
        "landmark": "Near BKC Metro Station",
        "latitude": 19.0596,
        "longitude": 72.8656,
        "contactName": "Sarah Wilson",
        "contactPhone": "+919876543212"
      },
      "packageDescription": "Documents",
      "packageWeightKg": 0.5,
      "totalPrice": 120,
      "specialInstructions": "Handle with care",
      "assignedAt": "2025-10-11T00:00:00.000Z",
      "acceptedAt": "2025-10-11T00:05:00.000Z"
    }
  ]
}
```


***

### **4.6. Get Earnings Summary**

```bash
curl -X GET "$BASE_URL/drivers/me/earnings" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Earnings retrieved successfully",
  "data": {
    "deliveries": {
      "total": 150,
      "today": 5,
      "thisWeek": 35,
      "thisMonth": 140
    },
    "earnings": {
      "total": 18000,
      "today": 600,
      "thisWeek": 4200,
      "thisMonth": 16800,
      "averageOrderValue": 120
    },
    "totalDistanceKm": 450.5
  }
}
```


***

<a name="orders"></a>

## 📦 **5. Order Management APIs**

### **5.1. Calculate Fare**

```bash
curl -X POST "$BASE_URL/orders/calculate-fare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "deliveryTypeId": 1,
    "distanceKm": 5.5,
    "weightKg": 2.5
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Fare calculated successfully",
  "data": {
    "base_price": 50,
    "distance_km": 5.5,
    "distance_price": 55,
    "weight_kg": 2.5,
    "weight_surcharge": 20,
    "total_price": 125
  }
}
```


***

### **5.2. Create New Order**

```bash
curl -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "deliveryTypeId": 1,
    "paymentMethodId": 1,
    "estimatedDistanceKm": 5.5,
    "packageDescription": "Documents",
    "packageWeightKg": 0.5,
    "specialInstructions": "Handle with care",
    "pickup": {
      "address": "123 Main Street, Andheri West, Mumbai",
      "building": "Sunrise Apartments",
      "floor": "5",
      "flatNumber": "501",
      "landmark": "Near Railway Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400058",
      "latitude": 19.1136,
      "longitude": 72.8697,
      "contactName": "John Doe",
      "contactPhone": "+919876543210"
    },
    "delivery": {
      "address": "456 Corporate Park, BKC, Mumbai",
      "building": "Tower A",
      "floor": "12",
      "flatNumber": "1205",
      "landmark": "Near BKC Metro Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400051",
      "latitude": 19.0596,
      "longitude": 72.8656,
      "contactName": "Sarah Wilson",
      "contactPhone": "+919876543212"
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 1,
    "order_uuid": "770e8400-e29b-41d4-a716-446655440002",
    "order_number": "SZ001000",
    "status": "pending",
    "total_price": 120,
    "created_at": "2025-10-11T00:00:00.000Z"
  }
}
```

**Save order ID:**

```bash
export TEST_ORDER_ID=1
```


***

### **5.3. Get Order Details**

```bash
curl -X GET "$BASE_URL/orders/$TEST_ORDER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "orderId": 1,
    "orderUuid": "770e8400-e29b-41d4-a716-446655440002",
    "orderNumber": "SZ001000",
    "status": "pending",
    "deliveryType": "Deliver Now",
    "client": {
      "name": "John Doe",
      "phone": "+919876543210"
    },
    "pickup": {
      "locationId": 1,
      "address": "123 Main Street, Andheri West",
      "building": "Sunrise Apartments",
      "floor": "5",
      "flat": "501",
      "landmark": "Near Railway Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400058",
      "latitude": 19.1136,
      "longitude": 72.8697,
      "contactName": "John Doe",
      "contactPhone": "+919876543210"
    },
    "delivery": {
      "locationId": 2,
      "address": "456 Corporate Park, BKC",
      "building": "Tower A",
      "floor": "12",
      "flat": "1205",
      "landmark": "Near BKC Metro Station",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400051",
      "latitude": 19.0596,
      "longitude": 72.8656,
      "contactName": "Sarah Wilson",
      "contactPhone": "+919876543212"
    },
    "package": {
      "description": "Documents",
      "weightKg": 0.5,
      "dimensions": null,
      "declaredValue": 0
    },
    "specialInstructions": "Handle with care",
    "pricing": {
      "basePrice": 50,
      "distancePrice": 55,
      "weightSurcharge": 0,
      "totalPrice": 120
    },
    "paymentMethod": "cod",
    "courier": null,
    "timestamps": {
      "createdAt": "2025-10-11T00:00:00.000Z",
      "acceptedAt": null,
      "pickedUpAt": null,
      "deliveredAt": null,
      "cancelledAt": null
    },
    "cancellationReason": null
  }
}
```


***

### **5.4. List User's Orders (Paginated)**

```bash
curl -X GET "$BASE_URL/orders?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "orderId": 1,
      "orderUuid": "770e8400-e29b-41d4-a716-446655440002",
      "orderNumber": "SZ001000",
      "status": "pending",
      "deliveryType": "Deliver Now",
      "packageDescription": "Documents",
      "totalPrice": 120,
      "createdAt": "2025-10-11T00:00:00.000Z",
      "pickup": {
        "address": "123 Main Street, Andheri West"
      },
      "delivery": {
        "address": "456 Corporate Park, BKC"
      },
      "courier": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```


***

### **5.5. Get Available Orders (For Drivers)**

```bash
curl -X GET "$BASE_URL/orders/available?latitude=19.0760&longitude=72.8777&radius=10&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Available orders retrieved successfully",
  "data": [
    {
      "orderId": 1,
      "orderUuid": "770e8400-e29b-41d4-a716-446655440002",
      "orderNumber": "SZ001000",
      "deliveryType": "Deliver Now",
      "totalPrice": 120,
      "packageDescription": "Documents",
      "packageWeightKg": 0.5,
      "createdAt": "2025-10-11T00:00:00.000Z",
      "pickup": {
        "address": "123 Main Street, Andheri West",
        "landmark": "Near Railway Station",
        "latitude": 19.1136,
        "longitude": 72.8697
      },
      "delivery": {
        "address": "456 Corporate Park, BKC"
      },
      "distanceFromCourierKm": 3.2,
      "estimatedDistanceKm": 5.5
    }
  ]
}
```


***

### **5.6. Driver Accepts Order**

```bash
curl -X POST "$BASE_URL/orders/$TEST_ORDER_ID/accept" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "assignmentId": 1,
    "orderId": 1,
    "courierId": 2,
    "assignedAt": "2025-10-11T00:05:00.000Z"
  }
}
```


***

### **5.7. Update Order Status (Picked Up)**

```bash
curl -X PUT "$BASE_URL/orders/$TEST_ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "picked_up"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 1,
    "status": "picked_up",
    "timestamp": "2025-10-11T00:10:00.000Z"
  }
}
```


***

### **5.8. Update Order Status (Delivered)**

```bash
curl -X PUT "$BASE_URL/orders/$TEST_ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "delivered"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 1,
    "status": "delivered",
    "timestamp": "2025-10-11T00:30:00.000Z"
  }
}
```


***

### **5.9. Cancel Order**

```bash
curl -X POST "$BASE_URL/orders/$TEST_ORDER_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "cancellationReason": "Changed my mind"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "success": true,
    "order_id": 1,
    "refund_initiated": false,
    "refund_amount": 0,
    "cancelled_at": "2025-10-11T00:02:00.000Z"
  }
}
```


***

<a name="static"></a>

## 📊 **6. Static Data APIs**

### **6.1. Get All Delivery Types**

```bash
curl -X GET "$BASE_URL/static/delivery-types"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Delivery types retrieved successfully",
  "data": [
    {
      "deliveryTypeId": 1,
      "name": "Deliver Now",
      "description": "Get your package delivered as soon as possible",
      "pricing": {
        "baseRate": 50,
        "perKmRate": 10
      },
      "estimatedTimeMinutes": 60,
      "estimatedTimeDisplay": "1 hour",
      "supportedWeightTiers": [
        {
          "tier_id": 1,
          "name": "Up to 1 kg",
          "min_weight_kg": 0,
          "max_weight_kg": 1,
          "additional_charge": 0
        }
      ],
      "labels": [],
      "isActive": true
    }
  ]
}
```


***

### **6.2. Get Weight Tiers**

```bash
curl -X GET "$BASE_URL/static/weight-tiers"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Weight tiers retrieved successfully",
  "data": [
    {
      "tierId": 1,
      "name": "Up to 1 kg",
      "minWeightKg": 0,
      "maxWeightKg": 1,
      "additionalCharge": 0
    },
    {
      "tierId": 2,
      "name": "Up to 5 kg",
      "minWeightKg": 1,
      "maxWeightKg": 5,
      "additionalCharge": 20
    }
  ]
}
```


***

### **6.3. Get Vehicle Categories**

```bash
curl -X GET "$BASE_URL/static/vehicle-categories"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Vehicle categories retrieved successfully",
  "data": [
    {
      "categoryId": 1,
      "name": "2-wheeler",
      "description": "Bike delivery",
      "maxWeightKg": 20,
      "icon": "bike"
    },
    {
      "categoryId": 2,
      "name": "3-wheeler",
      "description": "Auto/Tuk-tuk delivery",
      "maxWeightKg": 100,
      "icon": "auto"
    }
  ]
}
```


***

### **6.4. Get Package Types**

```bash
curl -X GET "$BASE_URL/static/package-types"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Package types retrieved successfully",
  "data": [
    {
      "packageTypeId": 1,
      "name": "Documents",
      "description": "Paper documents and files",
      "icon": "📄"
    },
    {
      "packageTypeId": 2,
      "name": "Food",
      "description": "Food items",
      "icon": "🍔"
    }
  ]
}
```


***

### **6.5. Get Payment Methods**

```bash
curl -X GET "$BASE_URL/static/payment-methods"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": [
    {
      "methodId": 1,
      "name": "cod",
      "displayName": "Cash on Delivery",
      "description": "Pay cash to the delivery person",
      "isActive": true
    },
    {
      "methodId": 2,
      "name": "upi",
      "displayName": "UPI Payment",
      "description": "Pay via UPI",
      "isActive": true
    }
  ]
}
```


***

### **6.6. Get All Create Order Data (Single Request)**

```bash
curl -X GET "$BASE_URL/static/create-order-data"
```

**Expected Response:**

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


***

<a name="journeys"></a>

## 🛤️ **7. Complete User Journey Examples**

### **Journey 1: Client Creates and Tracks Order**

```bash
# Step 1: Login/Register
curl -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "FIREBASE_TOKEN", "fullName": "John Doe", "role": "client"}'

# Save token
export ACCESS_TOKEN="..."

# Step 2: Get static data for order creation
curl -X GET "$BASE_URL/static/create-order-data"

# Step 3: Calculate fare
curl -X POST "$BASE_URL/orders/calculate-fare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"deliveryTypeId": 1, "distanceKm": 5.5, "weightKg": 0.5}'

# Step 4: Create order
curl -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{...order data...}'

# Save order ID
export ORDER_ID=1

# Step 5: Track order
curl -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Step 6: List all orders
curl -X GET "$BASE_URL/orders?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```


***

### **Journey 2: Driver Goes Online and Accepts Order**

```bash
# Step 1: Login as driver
curl -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "FIREBASE_TOKEN", "fullName": "Jane Driver", "role": "courier"}'

export ACCESS_TOKEN="..."

# Step 2: Go online
curl -X PUT "$BASE_URL/drivers/me/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"isAvailable": true, "isOnline": true}'

# Step 3: Update location
curl -X PUT "$BASE_URL/drivers/me/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"latitude": 19.0760, "longitude": 72.8777}'

# Step 4: Get available orders
curl -X GET "$BASE_URL/orders/available?latitude=19.0760&longitude=72.8777&radius=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Step 5: Accept order
curl -X POST "$BASE_URL/orders/1/accept" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Step 6: Update status to picked up
curl -X PUT "$BASE_URL/orders/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"status": "picked_up"}'

# Step 7: Update status to delivered
curl -X PUT "$BASE_URL/orders/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"status": "delivered"}'

# Step 8: Check earnings
curl -X GET "$BASE_URL/drivers/me/earnings" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```


***

<a name="errors"></a>

## ❌ **8. Error Handling Examples**

### **8.1. Invalid Token (401)**

```bash
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer invalid_token"
```

**Response:**

```json
{
  "success": false,
  "message": "Invalid token",
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

### **8.2. Missing Required Fields (400)**

```bash
curl -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "deliveryTypeId": 1
  }'
```

**Response:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "paymentMethodId",
      "message": "must have required property 'paymentMethodId'"
    },
    {
      "field": "pickup",
      "message": "must have required property 'pickup'"
    }
  ],
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

### **8.3. Resource Not Found (404)**

```bash
curl -X GET "$BASE_URL/orders/999999" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": false,
  "message": "Order not found",
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

### **8.4. Authorization Error (403)**

```bash
# Client trying to access driver endpoint
curl -X GET "$BASE_URL/drivers/me" \
  -H "Authorization: Bearer $CLIENT_ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```


***

## 🧪 **Testing Script**

Save this as `test-api.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api/v1"
FIREBASE_TOKEN="your_firebase_token_here"

echo "🧪 Shipzy API Testing Script"
echo "=============================="

# Test 1: Health Check
echo -e "\n${GREEN}Test 1: Health Check${NC}"
curl -s -X GET "$BASE_URL/../health" | jq

# Test 2: Get Static Data
echo -e "\n${GREEN}Test 2: Get Create Order Data${NC}"
curl -s -X GET "$BASE_URL/static/create-order-data" | jq '.data.deliveryTypes[0]'

# Test 3: Register User
echo -e "\n${GREEN}Test 3: Register New User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/firebase/verify" \
  -H "Content-Type: application/json" \
  -d "{\"idToken\": \"$FIREBASE_TOKEN\", \"fullName\": \"Test User\", \"role\": \"client\"}")

echo $REGISTER_RESPONSE | jq

# Extract token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.accessToken')

if [ "$ACCESS_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Authentication successful${NC}"
  
  # Test 4: Get User Profile
  echo -e "\n${GREEN}Test 4: Get User Profile${NC}"
  curl -s -X GET "$BASE_URL/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq
  
  echo -e "\n${GREEN}✓ All tests completed${NC}"
else
  echo -e "${RED}✗ Authentication failed${NC}"
fi
```

Run it:

```bash
chmod +x test-api.sh
./test-api.sh
```


***

## 📚 **Additional Resources**

### **Postman Collection**

Import this JSON into Postman for a complete collection of all endpoints.

### **Environment Variables for Postman**

```json
{
  "base_url": "http://localhost:3000/api/v1",
  "access_token": "",
  "refresh_token": "",
  "firebase_id_token": ""
}
```


***

**🎉 You now have complete testing documentation for all 25 API endpoints!**

This should help you thoroughly test your Shipzy backend API. Would you like me to also provide **deployment guides** (Docker, AWS, Railway) or **WebSocket/Real-time tracking** implementation? 🚀

