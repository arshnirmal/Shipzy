# Shipzy Backend API (v1)

This document is generated/maintained to match the **current implementation** under `backend/src/` (Fastify routes + controllers/services).

## Table of Contents

- [Base URL & Versioning](#base-url--versioning)
- [Authentication & Authorization](#authentication--authorization)
- [Common Schemas](#common-schemas)
- [Response Envelopes](#response-envelopes)
- [Auth](#auth)
- [Users](#users)
- [Drivers](#drivers)
- [Orders](#orders)
- [Addresses](#addresses)
- [Static](#static)
- [Health](#health)
- [Errors](#errors)
- [Rate Limiting](#rate-limiting)

---

## Base URL & Versioning

- API prefix: `/api/v1`
- Interactive Swagger UI (if installed): `/docs`
- OpenAPI JSON (if installed): `/documentation/json`

Examples:

- Local dev: `http://localhost:<PORT>/api/v1`
- Production: `https://<your-domain>/api/v1`

---

## Authentication & Authorization

### Bearer Token

Protected endpoints require:

```
Authorization: Bearer <accessToken>
```

Tokens are issued by auth endpoints and validated server-side (JWT + token revocation in DB).

### Roles

Some endpoints require a role:

- `client` (customer)
- `courier` (driver)

---

## Common Schemas

Type notation:

- `string (uuid)` means a UUID string
- `string (iso-datetime)` means ISO8601 datetime string
- `T | null` means nullable
- `field?: T` means optional

```ts
type UUID = string;
type ISODateTime = string;

type Coordinates = {
  latitude: number;   // -90..90
  longitude: number;  // -180..180
};

type FareBreakdown = {
  basePrice: number;
  distanceKm: number;
  distancePrice: number;
  weightSurcharge: number;
  platformFee?: number;
  subtotalBeforeTax?: number;
  gstAmount?: number;
  specialHandlingFee?: number;
  totalPrice: number;
  currency?: string;
};

type BaseUser = {
  userId: number;
  userUuid: UUID;
  role: "client" | "courier";
  phoneNumber?: string | null;
  email?: string | null;
  fullName: string;
  profilePictureUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};

type SavedAddress = {
  addressId: number;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  building?: string | null;
  floor?: string | null;
  flatNumber?: string | null;
  landmark?: string | null;
  addressType?: "home" | "work" | "other";
  label?: string;
  isDefault?: boolean;
  createdAt?: ISODateTime;
};
```

---

## Response Envelopes

### SuccessResponse

```ts
type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: ISODateTime;
};
```

### PaginatedResponse

Used by `GET /api/v1/orders`.

```ts
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: Pagination;
  timestamp: ISODateTime;
};
```

---

## Auth

Base: `/api/v1/auth`

### POST /api/v1/auth/register

Auth: Public

Request body:

```ts
type RegisterRequest = {
  fullName: string;                 // 2..100
  email: string;                    // email
  password: string;                 // 8..255
  role: "client" | "courier";
  phoneNumber?: string;             // 10..20
};
```

Response (201):

```ts
type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;                // seconds
  tokenType: "Bearer";
};

type AuthResponseData = {
  user: BaseUser;
  tokens: AuthTokens;
};

type Response = SuccessResponse<AuthResponseData>;
```

### POST /api/v1/auth/login

Auth: Public

Request body:

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Response (200):

```ts
type Response = SuccessResponse<AuthResponseData>;
```

### POST /api/v1/auth/google/verify

Auth: Public

Headers (optional but recommended):

```
X-Device-Id: <string>
User-Agent: <string>
```

Request body:

```ts
type GoogleAuthRequest = {
  idToken: string;
  role: "client" | "courier";
};
```

Response:

- 201 when `isNewUser=true`
- 200 when existing user logs in

```ts
type AuthResponseDataGoogle = AuthResponseData & {
  isNewUser?: boolean;
};

type Response = SuccessResponse<AuthResponseDataGoogle>;
```

### POST /api/v1/auth/refresh

Auth: Public

Request body:

```ts
type RefreshTokenRequest = {
  refreshToken: string;
};
```

Response (200):

```ts
type Response = SuccessResponse<AuthResponseData>;
```

### POST /api/v1/auth/logout

Auth: Bearer token required

Response (200):

```ts
type LogoutData = { message: string };
type Response = SuccessResponse<LogoutData>;
```

---

## Users

Base: `/api/v1/users`

All `/users/*` endpoints require `Authorization: Bearer <accessToken>`.

### GET /api/v1/users/me

Auth: Bearer token required

Response (200):

```ts
type Response = SuccessResponse<BaseUser>;
```

### PUT /api/v1/users/me

Auth: Bearer token required

Request body:

```ts
type UpdateProfileRequest = {
  fullName?: string;            // 2..100
  email?: string;               // email
  profilePictureUrl?: string;   // url
  phoneNumber?: string;         // 10..20
};
```

Response (200):

```ts
type Response = SuccessResponse<BaseUser>;
```

### GET /api/v1/users/me/addresses

Auth: Bearer token required

Response (200):

```ts
type Response = SuccessResponse<SavedAddress[]>;
```

### POST /api/v1/users/me/addresses

Auth: Bearer token required

Request body:

```ts
type SaveAddressRequest = {
  fullAddress: string;  // 5..500
  city: string;         // 2..100
  state: string;        // 2..100
  postalCode: string;   // 4..10
  latitude: number;
  longitude: number;
  building?: string | null;
  floor?: string | null;
  flatNumber?: string | null;
  landmark?: string | null;

  addressType?: "home" | "work" | "other";
  label?: string;       // <= 50
  isDefault?: boolean;
};
```

Response (201):

```ts
type Response = SuccessResponse<SavedAddress>;
```

### DELETE /api/v1/users/me/addresses/:id

Auth: Bearer token required

Path params:

```ts
type Params = { id: number };
```

Response (200):

```ts
type DeleteAddressData = { message: string };
type Response = SuccessResponse<DeleteAddressData>;
```

---

## Drivers

Base: `/api/v1/drivers`

All `/drivers/*` endpoints require:

- `Authorization: Bearer <accessToken>`
- Role: `courier`

### GET /api/v1/drivers/me

Response (200):

```ts
type DriverStatus = {
  isAvailable: boolean;
  isOnline: boolean;
  totalDeliveriesToday?: number;
  currentLocation: Coordinates | null;
  lastLocationUpdate: ISODateTime | null;
};

type Vehicle = {
  vehicleId?: number;
  categoryId?: number;
  category?: string;
  isActive?: boolean;
  vehicleNumber?: string;
  model?: string;
  year?: number;
} | null;

type DriverEarnings = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  averageOrderValue: number;
  totalDistanceKm: number;
};

type DriverProfile = {
  userId: number;
  userUuid: UUID;
  role: "courier";
  phoneNumber: string | null;
  fullName: string;
  email: string;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  status: DriverStatus;
  vehicle: Vehicle;
  earnings: DriverEarnings;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
};

type Response = SuccessResponse<DriverProfile>;
```

### PUT /api/v1/drivers/me

Request body:

```ts
type UpdateDriverProfileRequest = {
  fullName?: string;
  email?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
};
```

Response (200):

```ts
type UpdatedDriverProfile = {
  userId: number;
  fullName: string;
  email: string | null;
  profilePictureUrl: string | null;
  updatedAt: ISODateTime;
};

type Response = SuccessResponse<UpdatedDriverProfile>;
```

### PUT /api/v1/drivers/me/availability

Request body:

```ts
type UpdateAvailabilityRequest = {
  isAvailable: boolean;
  isOnline?: boolean;
  currentLocation?: Coordinates;
};
```

Response (200):

```ts
type AvailabilityData = {
  courierId: number;
  isAvailable: boolean;
  isOnline: boolean;
  updatedAt: ISODateTime;
};

type Response = SuccessResponse<AvailabilityData>;
```

### PUT /api/v1/drivers/me/location

Request body:

```ts
type UpdateLocationRequest = Coordinates;
```

Response (200):

```ts
type LocationData = {
  courierId: number;
  latitude: number;
  longitude: number;
  lastLocationUpdate: ISODateTime;
};

type Response = SuccessResponse<LocationData>;
```

### GET /api/v1/drivers/me/assignments

Response (200):

```ts
type EarningsBreakdown = {
  basePayout: number;
  distanceEarning: number;
  weightCompensation: number;
  peakHourBonus: number;
  urgencyBonus: number;
  onTimeBonus: number;
  qualityBonus: number;
  platformCommission: number;
  customerTip: number;
  grossEarning: number;
  netEarning: number;
};

type ActiveAssignment = {
  assignmentId: number;
  orderId: number;
  orderUuid?: UUID;
  orderNumber?: string;
  orderStatus?: string;
  assignmentStatus?: string;
  vehicleCategory?: string | null;
  vehicleCategoryDisplay?: string | null;
  packageType?: string | null;
  weightTier?: {
    id?: number;
    name?: string;
    minWeightKg?: number;
    maxWeightKg?: number;
  } | null;
  pickup: {
    address?: string | null;
    building?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  delivery: {
    address?: string | null;
    building?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  packageDescription?: string | null;
  specialInstructions?: string | null;
  declaredValue?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  driverEarnings: number;
  earningsBreakdown: EarningsBreakdown;
  estimatedDeliveryTime: number;       // minutes
  assignedAt?: ISODateTime | null;
  acceptedAt?: ISODateTime | null;
};

type Response = SuccessResponse<ActiveAssignment[]>;
```

### GET /api/v1/drivers/me/earnings

Query params:

```ts
type Query = {
  period?: "today" | "week" | "month" | "year"; // default: "today"
};
```

Response (200):

```ts
type EarningsSummary = {
  deliveries: {
    today?: number;
    total?: number;
    thisWeek?: number;
    thisMonth?: number;
  };
  earnings: {
    today?: number;
    total?: number;
    thisWeek?: number;
    thisMonth?: number;
    averageOrderValue?: number;
  };
  totalDistanceKm: number;
};

type Response = SuccessResponse<EarningsSummary>;
```

### GET /api/v1/drivers/me/rating

Response (200):

```ts
type DriverRatingStats = {
  averageRating: number;   // 0..5
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  lastUpdated: ISODateTime;
};

type Response = SuccessResponse<DriverRatingStats>;
```

---

## Orders

Base: `/api/v1/orders`

All `/orders/*` endpoints require `Authorization: Bearer <accessToken>`.

### POST /api/v1/orders/calculate-fare

Auth: Bearer token required

Request body:

```ts
type CalculateFareRequest = {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId: number;
  packageTypeId?: number | null;
  pickup: Coordinates;
  drop: Coordinates;
};
```

Response (200):

```ts
type Response = SuccessResponse<FareBreakdown>;
```

### POST /api/v1/orders

Auth: Bearer token required + role `client`

Request body:

```ts
type OrderAddress = {
  addressId?: number | null;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  building?: string | null;
  floor?: string | null;
  flatNumber?: string | null;
  landmark?: string | null;
  howToReach?: string | null;
  contactName: string;
  contactPhone: string;
};

type CreateOrderRequest = {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId: number;
  packageTypeId?: number | null;
  paymentMethodId: number;

  packageDescription?: string | null;
  specialInstructions?: string | null;
  scheduledPickupTime?: ISODateTime | null;
  scheduledDeliveryTime?: ISODateTime | null;
  declaredValue?: number | null;
  notifyRecipientSms?: boolean;          // default false
  couponCode?: string | null;

  fareBreakdown: FareBreakdown;
  pickup: OrderAddress;
  delivery: OrderAddress;
};
```

Response (201):

```ts
type CreatedOrder = {
  orderId: number;
  orderUuid: UUID;
  orderNumber: string;
  status: string;                 // typically "pending"
  fareBreakdown: FareBreakdown;
  estimatedDistanceKm: number;
  estimatedDurationMins?: number;
  createdAt: ISODateTime;
};

type Response = SuccessResponse<CreatedOrder>;
```

### GET /api/v1/orders

Auth: Bearer token required + role `client`

Query params:

```ts
type ListOrdersQuery = {
  page?: number;                   // default 1
  limit?: number;                  // default 20
  sortBy?: string;
  sortOrder?: "asc" | "desc";     // default "desc"
  status?: "active" | "completed" | "cancelled";
  dateFrom?: ISODateTime;
  dateTo?: ISODateTime;
};
```

Response (200):

```ts
type OrderListItem = {
  orderId: number;
  orderUuid: UUID;
  orderNumber?: string | null;
  status: string;
  statusId: number;
  deliveryTypeId: number;
  deliveryTypeDisplay?: string;
  vehicleCategoryId: number;
  vehicleCategoryDisplay?: string;
  packageDescription?: string | null;
  weightTierId?: number | null;
  weightTierDisplay?: string | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  actualDurationMins?: number | null;
  totalPrice: number;
  createdAt: ISODateTime;
  pickup: { address?: string | null; city?: string | null };
  delivery: { address?: string | null; city?: string | null };
  courier?: { name?: string | null; photo?: string | null } | null;
};

type Response = PaginatedResponse<OrderListItem>;
```

### GET /api/v1/orders/available

Auth: Bearer token required + role `courier`

Query params:

```ts
type AvailableOrdersQuery = {
  latitude: number;
  longitude: number;
  radius?: number; // km, default 10
  limit?: number;  // default 20
};
```

Response (200):

```ts
type AvailableOrderItem = {
  orderId: number;
  orderUuid: UUID;
  orderNumber: string;
  deliveryTypeDisplay: string;
  vehicleCategoryDisplay: string;
  createdAt: ISODateTime;
  pickup: {
    address: string;
    landmark?: string | null;
    city: string;
    coordinates: Coordinates;
  };
  delivery: {
    address: string;
    landmark?: string | null;
    city: string;
    coordinates: Coordinates;
  };
  fareBreakdown: FareBreakdown;
  estimatedDistanceKm: number;
  distanceFromDriverKm: number;
  packageDescription?: string | null;
};

type Response = SuccessResponse<AvailableOrderItem[]>;
```

### GET /api/v1/orders/:id

Auth: Bearer token required + role `client` or `courier`

Path params:

```ts
type Params = { id: number };
```

Response (200):

```ts
type OrderDetails = {
  orderId: number;
  orderUuid: UUID;
  orderNumber: string;
  status: string;
  statusId: number;
  deliveryTypeId: number;
  deliveryTypeDisplay?: string;
  vehicleCategoryId: number;
  vehicleCategoryDisplay?: string;
  packageDescription?: string | null;
  packageTypeId?: number | null;
  weightTierId?: number | null;
  weightTierDisplay?: string | null;
  specialInstructions?: string | null;

  pickup: {
    locationId?: number;
    address: string;
    building?: string | null;
    floor?: string | null;
    flat?: string | null;
    landmark?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    contactName?: string;
    contactPhone?: string;
  };
  delivery: {
    locationId?: number;
    address: string;
    building?: string | null;
    floor?: string | null;
    flat?: string | null;
    landmark?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    contactName?: string;
    contactPhone?: string;
  };

  fareBreakdown: FareBreakdown;

  client?: {
    userId: number;
    name?: string;
    phone?: string;
    profilePictureUrl?: string | null;
  };
  courier?: {
    userId: number;
    name?: string;
    phone?: string;
    profilePictureUrl?: string | null;
    vehicle?: {
      vehicleId?: number;
      categoryId?: number;
      category?: string;
      isActive?: boolean;
      vehicleNumber?: string;
      model?: string;
      year?: number;
    } | null;
    rating?: { averageRating: number; totalRatings: number };
  } | null;

  timeline: {
    confirmedAt: ISODateTime;
    assignedAt?: ISODateTime;
    pickedUpAt?: ISODateTime;
    deliveredAt?: ISODateTime;
    cancelledAt?: ISODateTime;
  };

  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  actualDurationMins?: number | null;
  createdAt: ISODateTime;
};

type Response = SuccessResponse<OrderDetails>;
```

### POST /api/v1/orders/:id/cancel

Auth: Bearer token required + role `client`

Path params:

```ts
type Params = { id: number };
```

Request body:

```ts
type CancelOrderRequest = { cancellationReason: string };
```

Response (200):

```ts
type CancelOrderResult = {
  success: boolean;
  orderId?: number;
  status?: string;
  refundAmount?: number;
  refundStatus?: string;
  error?: string;
  // Note: the stored procedure may return additional fields
  [key: string]: unknown;
};

type Response = SuccessResponse<CancelOrderResult>;
```

### POST /api/v1/orders/:id/accept

Auth: Bearer token required + role `courier`

Path params:

```ts
type Params = { id: number };
```

Response (200):

```ts
type AcceptOrderData = {
  assignmentId: number;
  orderId: number;
  courierId: number;
  assignedAt: ISODateTime;
};

type Response = SuccessResponse<AcceptOrderData>;
```

### PUT /api/v1/orders/:id/status

Auth: Bearer token required + role `courier`

Path params:

```ts
type Params = { id: number };
```

Request body:

```ts
type UpdateOrderStatusRequest = {
  status: "picked_up" | "in_transit" | "delivered";
};
```

Response (200):

```ts
type UpdateOrderStatusData = {
  orderId: number;
  status: string;
  timestamp: ISODateTime;
};

type Response = SuccessResponse<UpdateOrderStatusData>;
```

### POST /api/v1/orders/:id/rate

Auth: Bearer token required + role `client`

Path params:

```ts
type Params = { id: number };
```

Request body:

```ts
type RateOrderRequest = {
  rating: number;          // 1..5
  comment?: string | null; // <= 500
  anonymous?: boolean;
};
```

Response (200):

```ts
type RatingResponse = {
  ratingId: number;
  orderId: number;
  driverId: number;
  customerId: number;
  rating: number;
  isAnonymous?: boolean;
  comment?: string | null;
  createdAt: ISODateTime;
};

type Response = SuccessResponse<RatingResponse>;
```

---

## Addresses

Base: `/api/v1/addresses`

All `/addresses/*` endpoints require `Authorization: Bearer <accessToken>`.

### POST /api/v1/addresses/search

Request body:

```ts
type SearchAddressesRequest = {
  query: string;                 // 2..256
  proximity?: Coordinates;
  country?: string;              // "IN" or "IN,US" (comma-separated, uppercase 2-letter)
  types?: ("address" | "poi" | "place" | "neighborhood" | "locality" | "region" | "country")[];
  limit?: number;                // 1..10
};
```

Response (200):

```ts
type AddressSearchSuggestion = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeType: string;
  coordinates?: Coordinates;
  context: Record<string, string | undefined>;
  sessionToken: string;
};

type Response = SuccessResponse<AddressSearchSuggestion[]>;
```

### POST /api/v1/addresses/retrieve

Request body:

```ts
type RetrievePlaceRequest = {
  mapboxId: string;
  sessionToken: string;
};
```

Response (200):

```ts
type RetrievedPlace = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  coordinates: Coordinates;
  context: Record<string, string | undefined>;
  featureType: string;
  bbox: number[] | null;
};

type Response = SuccessResponse<RetrievedPlace>;
```

### POST /api/v1/addresses/reverse-geocode

Request body:

```ts
type ReverseGeocodeRequest = {
  latitude: number;
  longitude: number;
  types?: ("address" | "poi" | "place" | "neighborhood" | "locality" | "region" | "country")[];
  limit?: number; // 1..5
};
```

Response (200):

```ts
type ReverseGeocodeResultItem = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeName: string | null;
  coordinates: Coordinates;
  featureType: string;
  properties: { accuracy: number } | null;
  context: { id: string; text: string }[] | null;
  bbox: number[] | null;
  relevance: number | null;
};

type ReverseGeocodeResponseData = {
  coordinates: Coordinates;
  results: ReverseGeocodeResultItem[];
  total: number;
};

type Response = SuccessResponse<ReverseGeocodeResponseData>;
```

### POST /api/v1/addresses/directions

Request body:

```ts
type DirectionsRequest = {
  origin: Coordinates;
  destination: Coordinates;
  profile?: "driving" | "walking" | "cycling"; // default "driving"
};
```

Response (200):

```ts
type DirectionsResponseData = {
  distance: number;              // meters
  duration: number;              // seconds
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
  };
  distanceKm: number;
  durationMinutes: number;
  origin: Coordinates;
  destination: Coordinates;
};

type Response = SuccessResponse<DirectionsResponseData>;
```

### POST /api/v1/addresses/distance

Request body:

```ts
type DistanceRequest = {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
};
```

Response (200):

```ts
type DistanceResponseData = { distanceKm: number };
type Response = SuccessResponse<DistanceResponseData>;
```

---

## Static

Base: `/api/v1/static`

Static endpoints are **public** (no auth required).

```ts
type DeliveryType = {
  deliveryTypeId: number;
  name: string;
  displayName?: string;
  description?: string | null;
  pricing?: { baseRate: number; perKmRate: number };
  supportedVehicles?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

type WeightTier = {
  tierId: number;
  name: string;
  minWeightKg: number;
  maxWeightKg: number;
  additionalCharge: number;
};

type VehicleCategory = {
  categoryId: number;
  name: string;
  description?: string;
  maxWeightKg?: number;
  icon?: string;
};

type PackageType = {
  packageTypeId: number;
  name: string;
  description?: string;
  icon?: string;
};

type StaticPaymentMethod = {
  methodId: number;
  name: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
};

type CreateOrderData = {
  deliveryTypes: DeliveryType[];
  packageTypes: PackageType[];
  paymentMethods: StaticPaymentMethod[];
};

type OrderStatus = {
  statusId: number;
  name: string;
  description?: string;
};
```

### GET /api/v1/static/delivery-types

Response (200):

```ts
type Response = SuccessResponse<DeliveryType[]>;
```

### GET /api/v1/static/weight-tiers

Response (200):

```ts
type Response = SuccessResponse<WeightTier[]>;
```

### GET /api/v1/static/vehicle-categories

Response (200):

```ts
type Response = SuccessResponse<VehicleCategory[]>;
```

### GET /api/v1/static/package-types

Response (200):

```ts
type Response = SuccessResponse<PackageType[]>;
```

### GET /api/v1/static/payment-methods

Response (200):

```ts
type Response = SuccessResponse<StaticPaymentMethod[]>;
```

### GET /api/v1/static/create-order-data

Response (200):

```ts
type Response = SuccessResponse<CreateOrderData>;
```

### GET /api/v1/static/order-statuses

Response (200):

```ts
type Response = SuccessResponse<OrderStatus[]>;
```

---

## Health

### GET /health

Auth: Public

Response (200):

```ts
type HealthOk = {
  status: "ok";
  timestamp: ISODateTime;
  uptime: number;
  environment: string;
  database: {
    connected: boolean;
    pool: {
      totalConnections: number;
      idleConnections: number;
      waitingConnections: number;
    };
  };
  memory: {
    used: number;     // MB
    total: number;    // MB
    external: number; // MB
  };
};
```

Response (503):

```ts
type HealthError = {
  status: "error";
  timestamp: ISODateTime;
  error: string;
  database: { connected: false };
};
```

### GET /api/v1

Auth: Public

```ts
type ApiInfo = {
  name: string;
  version: string;
  timestamp: ISODateTime;
};
```

---

## Errors

Errors are returned in a small number of shapes depending on where they occur (validation vs operational errors vs not-found vs rate-limit). Frontend should handle these as a union.

### ErrorResponse (common)

```ts
type ValidationErrorItem = { field: string; message?: string };

type ErrorResponse = {
  success: false;
  message: string;
  timestamp: ISODateTime;
  errors?: ValidationErrorItem[] | unknown | null;
  error?: string;          // some auth provider errors
  path?: string;           // notFound handler
  retryAfter?: number;     // rate limiting
};
```

Common status codes:

- `400` validation
- `401` authentication / token invalid
- `403` authorization
- `404` route not found
- `409` constraint violation
- `429` rate limited
- `500` unexpected server error

---

## Rate Limiting

Global rate limiting is enabled. Auth endpoints have stricter limits than other routes.

When rate-limited:

```ts
type RateLimitResponse = {
  success: false;
  message: "Rate limit exceeded";
  retryAfter: number;
  timestamp: ISODateTime;
};
```
