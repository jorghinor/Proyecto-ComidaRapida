# comidarapida — Scaffold (MVP)
This scaffold contains a minimal full-stack starter for *COMIDARAPIDA*:
- Frontend: Next.js (TypeScript) + Tailwind CSS with example Hero parallax, Floating Food Types menu, Ad cards and discount badge overlay.
- Backend: Express.js (TypeScript) + Prisma schema for PostgreSQL with minimal CRUD for ads.
- Docker Compose to run Postgres, Redis, backend, and web.

**How to run (development)**

1. Copy `.env.example` to `.env` and fill variables (POSTGRES_PASSWORD etc).
2. From repository root:
   ```bash
   docker-compose up --build
   ```
3. In another shell, run:
   - `cd backend && npm install && npx prisma migrate dev --name init && npm run seed && npm run dev`
   - `cd web && npm install && npm run dev`

This scaffold is intentionally minimal. It includes:
- example SQL/Prisma schema
- basic Next.js pages (Home, search, ad detail)
- Docker Compose for local development with Postgres

You can extend features: authentication, file uploads (Cloudinary/S3), workers, Redis queues, payments, admin panel, analytics, tests, CI.



## Features added in full scaffold
- NextAuth skeleton (Credentials provider) for authentication.
- Cloudinary upload API placeholder and env example.
- Backend score calculation with Redis caching (ioredis) and admin report endpoint.
- Framer Motion and GSAP examples in frontend components.
- React Three Fiber placeholder component.
- Worker placeholder service added to docker-compose.

Note: This scaffold is for development and demonstration. Replace mock auth/upload with real implementations before production.
