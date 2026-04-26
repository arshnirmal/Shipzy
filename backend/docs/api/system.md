# System Routes

Source of truth:

- [backend/src/app.ts](../../src/app.ts)
- [backend/src/server.ts](../../src/server.ts)

These routes live outside the feature modules and are registered at the app level.

## Frontend Setup

```bash
HOST_URL="http://localhost:3000"
```

## Routes

| Method | Path                | Auth                    | Notes                                             |
| ------ | ------------------- | ----------------------- | ------------------------------------------------- |
| GET    | `/health`           | Public                  | Main health check used by the app runtime         |
| GET    | `/_internal/health` | Public at the API layer | Internal probe endpoint for infrastructure checks |
| GET    | `/api/v1`           | Public                  | Returns API name, version, and timestamp          |

## Curl And Response Examples

### GET /health

```bash
curl -X GET "$HOST_URL/health"
```

```json
{
  "status": "ok",
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

### GET /\_internal/health

```bash
curl -X GET "$HOST_URL/_internal/health"
```

```json
{
  "status": "ok",
  "timestamp": "2026-04-16T10:00:00.000Z",
  "uptime": 120.51,
  "database": {
    "connected": true,
    "pool": {
      "totalConnections": 10,
      "idleConnections": 8,
      "waitingConnections": 0
    }
  },
  "memory": {
    "used": 72,
    "total": 96
  }
}
```

### GET /api/v1

```bash
curl -X GET "$HOST_URL/api/v1"
```

```json
{
  "name": "Shipzy API",
  "version": "1.0.0",
  "timestamp": "2026-04-16T10:00:00.000Z"
}
```

## Notes

- `/_internal/health` is intended for infra-level protection rather than route-level auth.
- The top-level routes are defined in `backend/src/app.ts`, not inside a module plugin.
