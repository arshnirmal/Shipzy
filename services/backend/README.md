# Shipzy Backend

The backend API for the Shipzy ride-sharing platform, built with Node.js and Fastify.

## Setup

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Run tests: `npm test`

## API Endpoints

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /orders` - Create order
- `GET /orders/:id` - Get order

See docs/api/swagger.yaml for full spec.

## Tech Stack

- Fastify
- TypeScript
- Prisma (for DB)
- JWT for auth
