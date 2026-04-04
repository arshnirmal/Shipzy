# Drivers Module UML (with JSONB structures)

```mermaid
classDiagram
  direction LR

  class DriversRoutes {
    +GET /drivers/me
    +PUT /drivers/me
    +PUT /drivers/me/availability
    +PUT /drivers/me/location
    +GET /drivers/me/assignments
    +GET /drivers/me/earnings
    +GET /drivers/me/rating
  }

  class DriversController {
    +getDriverProfile()
    +updateProfile()
    +updateAvailability()
    +updateLocation()
    +getActiveAssignments()
    +getEarnings()
    +getRating()
  }

  class DriversService {
    +getDriverProfile(userId)
    +updateProfile(userId, profilePatch)
    +updateAvailability(userId, availabilityPayload)
    +updateLocation(userId, coordinates)
    +getActiveAssignments(userId)
    +getEarningsSummary(userId, period)
    -calculateDriverEarnings(assignment)
  }

  class DriversRepository {
    +findCourierById(userId)
    +updateProfile(userId, profilePatch)
    +updateAvailability(courierId, isAvailable, isOnline)
    +updateLocation(courierId, latitude, longitude)
    +getActiveAssignments(courierId)
    +getEarningsSummary(courierId)
    +createSession(driverId, location)
    +endActiveSession(driverId, location)
  }

  class SessionsRepository {
    +createSession(data)
    +findActiveSession(driverId)
    +endSession(data)
    +getSessionsInRange(driverId, startDate, endDate)
  }

  class users_profiles {
    +user_id PK
    +user_uuid UUID
    +role user_role
    +phone_number VARCHAR(20)
    +email VARCHAR(100)
    +full_name VARCHAR(100)
    +profile_picture_url VARCHAR(255)
    +is_verified BOOLEAN
    +is_active BOOLEAN
    +created_at TIMESTAMPTZ
    +updated_at TIMESTAMPTZ
    +deleted_at TIMESTAMPTZ
  }

  class logistics_courier_status {
    +status_id PK
    +courier_id FK
    +is_available BOOLEAN
    +is_online BOOLEAN
    +current_location GEOGRAPHY(Point,4326)
    +last_location_update TIMESTAMPTZ
    +current_assignment_id FK
    +total_deliveries_today INT
    +avg_rating NUMERIC(3,2)
    +total_ratings INT
    +created_at TIMESTAMPTZ
    +updated_at TIMESTAMPTZ
  }

  class logistics_driver_sessions {
    +session_id PK
    +driver_id FK
    +started_at TIMESTAMPTZ
    +ended_at TIMESTAMPTZ
    +total_online_minutes INT
    +last_location GEOGRAPHY(Point,4326)
    +created_at TIMESTAMPTZ
  }

  class orders_requests {
    +order_id PK
    +order_uuid UUID
    +order_number VARCHAR(50)
    +status order_status
    +pickup_location JSONB
    +delivery_location JSONB
    +snapshot JSONB
    +pricing JSONB
    +package JSONB
    +estimated_distance_km NUMERIC(6,2)
    +actual_distance_km NUMERIC(6,2)
    +total_price NUMERIC(10,2)
  }

  class orders_courier_assignments {
    +assignment_id PK
    +order_id FK
    +courier_id FK
    +status assignment_status
    +assigned_at TIMESTAMPTZ
    +timeline JSONB
    +completed_at TIMESTAMPTZ
  }

  class JSONB_OrderLocation {
    +addressId number|null
    +fullAddress string
    +city string
    +state string
    +postalCode string
    +latitude number
    +longitude number
    +contactName string
    +contactPhone string
    +building string|null
    +landmark string|null
  }

  class JSONB_OrderSnapshot {
    +deliveryType {id,name,displayName}
    +vehicleCategory {id,name,displayName,maxWeightKg}
    +weightTier {id,name,minWeightKg,maxWeightKg,additionalCharge}|null
    +packageType {id,name}|null
    +paymentMethod {id,name}
  }

  class JSONB_OrderPricing {
    +basePrice number
    +distanceKm number
    +distancePrice number
    +weightSurcharge number
    +platformFee number
    +specialHandlingFee number
    +subtotalBeforeTax number
    +gstAmount number
    +totalPrice number
    +currency string
  }

  class JSONB_OrderPackage {
    +description string|null
    +specialInstructions string|null
    +declaredValue number|null
    +notifyRecipientSms boolean
  }

  class JSONB_AssignmentTimeline {
    +acceptedAt ISODateTime|null
    +rejectedAt ISODateTime|null
  }

  DriversRoutes --> DriversController
  DriversController --> DriversService
  DriversService --> DriversRepository
  DriversRepository --> SessionsRepository

  DriversRepository --> users_profiles : query/update
  DriversRepository --> logistics_courier_status : status/location
  SessionsRepository --> logistics_driver_sessions : session tracking
  DriversRepository --> orders_courier_assignments : active assignments
  DriversRepository --> orders_requests : assignment source

  orders_requests --> JSONB_OrderLocation : pickup_location
  orders_requests --> JSONB_OrderLocation : delivery_location
  orders_requests --> JSONB_OrderSnapshot : snapshot
  orders_requests --> JSONB_OrderPricing : pricing
  orders_requests --> JSONB_OrderPackage : package
  orders_courier_assignments --> JSONB_AssignmentTimeline : timeline
```
