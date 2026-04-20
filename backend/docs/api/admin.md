# Admin API

Base path: /api/v1/admin

Source of truth:

- [backend/src/modules/admin/admin.routes.ts](../../src/modules/admin/admin.routes.ts)
- [backend/src/modules/admin/admin.schema.ts](../../src/modules/admin/admin.schema.ts)
- [backend/src/modules/admin/admin.zod.ts](../../src/modules/admin/admin.zod.ts)

## Access Pattern

- Routes use `fastify.authenticate` plus `authorize('admin')`.
- Mutations use a stricter rate limit (see `admin.routes.ts`).

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<admin-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

## Routes

| Method | Path                                      | Auth  | Notes                                      |
| ------ | ----------------------------------------- | ----- | ------------------------------------------ |
| POST   | `/drivers/:userId/onboarding-review`      | admin | Approve or reject a courier’s onboarding   |

`userId` is the numeric `users.profiles.user_id` for the courier.

## POST /drivers/:userId/onboarding-review

### Approve

```bash
curl -X POST "$API_BASE_URL/admin/drivers/42/onboarding-review" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"decision":"approve"}'
```

### Reject

```bash
curl -X POST "$API_BASE_URL/admin/drivers/42/onboarding-review" \
	-H "Authorization: Bearer $ACCESS_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"decision":"reject","rejectedReason":"Documents unreadable"}'
```

Success response (`data` envelope):

```json
{
  "success": true,
  "message": "Driver onboarding approved",
  "data": {
    "userId": 42,
    "isVerified": true,
    "onboarding": {
      "status": "approved",
      "stepsCompleted": ["profile", "vehicle", "kyc"],
      "submittedAt": "2026-04-16T10:00:00.000Z",
      "approvedAt": "2026-04-16T10:05:00.000Z"
    }
  },
  "timestamp": "2026-04-16T10:05:00.000Z"
}
```

## Notes

- Request body is a discriminated union on `decision`: `approve` has no extra fields; `reject` requires `rejectedReason` (3–2000 characters).
- Implementation: [backend/src/modules/admin/admin.service.ts](../../src/modules/admin/admin.service.ts), [backend/src/modules/admin/admin.controller.ts](../../src/modules/admin/admin.controller.ts).
