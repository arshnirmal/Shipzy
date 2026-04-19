# Auth API

Base path: /api/v1/auth

Source of truth:

- [backend/src/modules/auth/auth.routes.ts](../../src/modules/auth/auth.routes.ts)
- [backend/src/modules/auth/auth.schema.ts](../../src/modules/auth/auth.schema.ts)
- [backend/src/modules/auth/auth.zod.ts](../../src/modules/auth/auth.zod.ts)

## Frontend Setup

Use these environment variables in examples:

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
REFRESH_TOKEN="<jwt-refresh-token>"
```

Success envelope (all successful auth endpoints):

```json
{
  "success": true,
  "message": "Human readable success message",
  "data": {},
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

Common error envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Specific error detail",
  "statusCode": 400,
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Routes

| Method | Path               | Auth         | Success Status |
| ------ | ------------------ | ------------ | -------------- |
| POST   | /google/verify     | Public       | 200 or 201     |
| POST   | /refresh           | Public       | 200            |
| POST   | /register          | Public       | 201            |
| POST   | /login             | Public       | 200            |
| POST   | /register/business | Public       | 201            |
| POST   | /logout            | Bearer token | 200            |

## Endpoint Details

### POST /google/verify

Request body:

```json
{
  "provider": {
    "idToken": "firebase-id-token"
  },
  "identity": {
    "role": "client"
  }
}
```

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/google/verify" \
	-H "Content-Type: application/json" \
	-d '{
		"provider": {"idToken": "firebase-id-token"},
		"identity": {"role": "client"}
	}'
```

Success response (200/201):

```json
{
  "success": true,
  "message": "Google token verified",
  "data": {
    "actor": {
      "user": {
        "userId": 12,
        "userUuid": "b5b8027e-36f3-4f3f-8d0e-7b789bd1bb1c",
        "role": "client",
        "fullName": "Ava Sharma",
        "email": "ava@example.com",
        "phoneNumber": null,
        "profilePictureUrl": null,
        "isVerified": true,
        "isActive": true
      }
    },
    "auth": {
      "tokens": {
        "accessToken": "...",
        "refreshToken": "...",
        "expiresIn": 3600,
        "tokenType": "Bearer"
      },
      "session": {
        "method": "google",
        "isNewUser": false
      }
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /refresh

Request body:

```json
{
  "tokens": {
    "refreshToken": "<refresh-token>"
  }
}
```

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/refresh" \
	-H "Content-Type: application/json" \
	-d '{
		"tokens": {"refreshToken": "'$REFRESH_TOKEN'"}
	}'
```

Success response (200): same payload shape as POST /google/verify, with session.method = "refresh".

### POST /register

Request body:

```json
{
  "identity": {
    "fullName": "Ava Sharma",
    "role": "client",
    "phoneNumber": "+919999999999"
  },
  "credentials": {
    "email": "ava@example.com",
    "password": "StrongPassword123"
  }
}
```

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/register" \
	-H "Content-Type: application/json" \
	-d '{
		"identity": {"fullName": "Ava Sharma", "role": "client", "phoneNumber": "+919999999999"},
		"credentials": {"email": "ava@example.com", "password": "StrongPassword123"}
	}'
```

Success response (201): same auth envelope shape as POST /google/verify.

### POST /login

Request body:

```json
{
  "credentials": {
    "email": "ava@example.com",
    "password": "StrongPassword123"
  }
}
```

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/login" \
	-H "Content-Type: application/json" \
	-d '{
		"credentials": {"email": "ava@example.com", "password": "StrongPassword123"}
	}'
```

Success response (200): same auth envelope shape as POST /google/verify, with session.method = "email".

### POST /register/business

Request body:

```json
{
  "identity": {
    "fullName": "Rohan Mehta",
    "phoneNumber": "+919888888888"
  },
  "credentials": {
    "email": "ops@acme-logistics.com",
    "password": "StrongPassword123"
  },
  "business": {
    "businessName": "Acme Logistics",
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "AAAAA9999A",
    "businessType": "Pvt Ltd",
    "website": "https://acme-logistics.example",
    "monthlyVolume": "500-2000"
  }
}
```

Optional `business` fields (`gstNumber`, `panNumber`, `businessType`, `website`, `monthlyVolume`) are persisted in `users.profiles.business_meta` JSONB when provided.

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/register/business" \
	-H "Content-Type: application/json" \
	-d '{
		"identity": {"fullName": "Rohan Mehta", "phoneNumber": "+919888888888"},
		"credentials": {"email": "ops@acme-logistics.com", "password": "StrongPassword123"},
		"business": {"businessName": "Acme Logistics", "gstNumber": "22AAAAA0000A1Z5", "monthlyVolume": "500-2000"}
	}'
```

Success response (201): same auth envelope shape as POST /google/verify, with actor.user.role = "business".

### POST /logout

No request body.

Curl:

```bash
curl -X POST "$API_BASE_URL/auth/logout" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

Success response (200):

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "message": "Session ended"
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Frontend Notes

- Route-level rate limiting is configured on auth endpoints.
- Persist both accessToken and refreshToken from auth responses.
- Refresh token flow uses POST /auth/refresh with tokens.refreshToken in body.
