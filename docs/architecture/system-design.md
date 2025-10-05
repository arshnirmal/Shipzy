# Shipzy System Design

## Overview

Shipzy is a ride-sharing platform with a mobile app for users and drivers, backed by a Node.js API.

## Components

### Frontend

- User App (Flutter): Booking rides, tracking
- Driver App (Flutter): Accepting rides, navigation

### Backend

- Fastify API: Handles auth, orders, matching
- PostgreSQL: User, order data
- Redis: Caching, sessions

### Infrastructure

- Docker for containerization
- DigitalOcean Droplet for hosting
- Nginx as reverse proxy

## Data Flow

1. User books ride via app -> API creates order
2. Matching service assigns driver
3. Driver accepts -> Update order status
4. Real-time updates via WebSockets

## Scalability

- Horizontal scaling of API instances
- Database sharding for growth
