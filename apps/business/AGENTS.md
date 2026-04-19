<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Backend API reference (business app)

When implementing or changing anything that calls the Shipzy backend (auth, registration, proxies, orders, addresses, drivers, ratings, static assets, or system behavior), **read the canonical contracts in the repo first**:

- **Primary:** `backend/docs/api/auth.md` — login, refresh, business registration, sessions.
- **Primary:** `backend/docs/api/business.md` — business-scoped resources and payloads.
- **As needed:** `backend/docs/api/orders.md`, `addresses.md`, `drivers.md`, `users.md`, `ratings.md`, `static.md`, `system.md`.

Paths are from the **repository root** (`shipzy/`). Do not guess request/response shapes or field names for the business web app; align with these docs (and the backend implementation if the doc is ambiguous).
