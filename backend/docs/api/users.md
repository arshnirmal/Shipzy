# Users API

Base path: /api/v1/users

Source of truth:

- [backend/src/modules/users/users.routes.ts](../../src/modules/users/users.routes.ts)
- [backend/src/modules/users/users.schema.ts](../../src/modules/users/users.schema.ts)

## Access Pattern

- All user routes require authentication

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Routes

| Method | Path                | Auth         | Notes                                     |
| ------ | ------------------- | ------------ | ----------------------------------------- |
| GET    | `/me`               | Bearer token | Fetch the current user profile            |
| PATCH  | `/me`               | Bearer token | Update the current user profile           |
| GET    | `/me/addresses`     | Bearer token | List saved addresses for the current user |
| POST   | `/me/addresses`     | Bearer token | Save a new address for the current user   |
| DELETE | `/me/addresses/:id` | Bearer token | Delete one saved address                  |

## Curl And Response Examples

### GET /me

```bash
curl -X GET "$API_BASE_URL/users/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "User profile fetched",
  "data": {
    "profile": {
      "userId": 10,
      "userUuid": "1c8d1dc5-c619-49de-91db-a0e10e98bc18",
      "role": "client",
      "fullName": "Ava Sharma",
      "email": "ava@example.com",
      "phoneNumber": "+919999999999",
      "profilePictureUrl": null,
      "isVerified": true,
      "isActive": true
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### PATCH /me

Request body (any subset, at least one field):

```json
{
  "fullName": "Ava Sharma",
  "phoneNumber": "+919888888888",
  "profilePictureUrl": "https://cdn.example.com/avatar.jpg"
}
```

```bash
curl -X PATCH "$API_BASE_URL/users/me" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"fullName":"Ava Sharma","phoneNumber":"+919888888888"}'
```

Success response: same shape as GET /me.

### GET /me/addresses

```bash
curl -X GET "$API_BASE_URL/users/me/addresses" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Addresses fetched",
  "data": {
    "addresses": [
      {
        "addressId": 21,
        "fullAddress": "22 Church Street, Bengaluru",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560001",
        "latitude": 12.9754,
        "longitude": 77.6058,
        "addressType": "home",
        "label": "Home",
        "isDefault": true
      }
    ],
    "total": 1
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### POST /me/addresses

Request body:

```json
{
  "fullAddress": "22 Church Street, Bengaluru",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560001",
  "latitude": 12.9754,
  "longitude": 77.6058,
  "addressType": "home",
  "label": "Home",
  "isDefault": true,
  "landmark": "Near MG Road Metro"
}
```

```bash
curl -X POST "$API_BASE_URL/users/me/addresses" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"fullAddress":"22 Church Street, Bengaluru",
		"city":"Bengaluru",
		"state":"Karnataka",
		"postalCode":"560001",
		"latitude":12.9754,
		"longitude":77.6058,
		"addressType":"home",
		"label":"Home",
		"isDefault":true
	}'
```

```json
{
  "success": true,
  "message": "Address saved",
  "data": {
    "address": {
      "addressId": 21,
      "fullAddress": "22 Church Street, Bengaluru",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560001",
      "latitude": 12.9754,
      "longitude": 77.6058,
      "addressType": "home",
      "label": "Home",
      "isDefault": true
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### DELETE /me/addresses/:id

```bash
curl -X DELETE "$API_BASE_URL/users/me/addresses/21" \
	-H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "success": true,
  "message": "Address deleted",
  "data": {
    "deletion": {
      "addressId": 21,
      "deleted": true
    }
  },
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- The module focuses on the current authenticated user; there are no public user endpoints here.
- Validation is defined in `users.schema.ts`.
