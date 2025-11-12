# Daybreak

A modern TypeScript monorepo combining **Hono** for the backend API and **Vite + React** for the frontend, with end-to-end type safety through Hono RPC.

## Overview

Daybreak is a full-stack monorepo that demonstrates modern web development practices:
- **Backend**: Hono - A lightweight, ultrafast web framework for edge and Node.js
- **Frontend**: Vite + React - Modern React development with instant HMR
- **Type Safety**: Hono RPC provides automatic type inference from backend to frontend
- **Authentication**: Clerk for secure, production-ready auth
- **State Management**: TanStack Query for efficient server state
- **Package Management**: pnpm workspaces for efficient monorepo management

## Features

✅ **End-to-end Type Safety** - Types flow automatically from backend routes to frontend
✅ **Hono RPC** - No code generation, just pure TypeScript type inference
✅ **Clerk Authentication** - Secure auth with minimal setup
✅ **TanStack Query** - Powerful async state management
✅ **Fast Development** - Vite's instant HMR + tsx watch mode
✅ **Monorepo Architecture** - Share code and types between apps

## Project Structure

```
Daybreak/
├── apps/
│   ├── backend/              # Hono API server (Node.js)
│   │   ├── src/
│   │   │   └── index.ts      # API routes + type exports
│   │   ├── .env              # Backend environment variables
│   │   └── package.json      # Backend dependencies
│   │
│   └── frontend/             # Vite + React application
│       ├── src/
│       │   ├── lib/          # API client (Hono RPC)
│       │   ├── hooks/        # TanStack Query hooks
│       │   ├── components/   # React components
│       │   └── main.tsx      # Entry point with providers
│       ├── .env.local        # Frontend environment variables
│       └── package.json      # Frontend dependencies
│
├── pnpm-workspace.yaml       # Workspace configuration
└── package.json              # Root package with scripts
```

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** - Install with `npm install -g pnpm`
- **Clerk Account** - Sign up at [clerk.com](https://clerk.com)

### 1. Installation

Clone the repository and install dependencies:

```bash
cd Daybreak
pnpm install
```

### 2. Environment Setup

#### Backend (apps/backend/.env)

Get your Clerk keys from [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys)

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

#### Frontend (apps/frontend/.env.local)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

> **Note**: `.env.local` is for local development and is already in `.gitignore`

### 3. Development

Run both frontend and backend in parallel:

```bash
pnpm dev
```

Or run them separately:

```bash
# Terminal 1 - Backend API (http://localhost:3000)
pnpm dev:backend

# Terminal 2 - Frontend (http://localhost:5173)
pnpm dev:frontend
```

The frontend will be available at **http://localhost:5173**

### 4. Building for Production

```bash
# Build both apps
pnpm build

# Or build separately
pnpm build:backend
pnpm build:frontend
```

## How Hono RPC Works

Hono RPC provides end-to-end type safety without code generation. Here's how:

### 1. Backend exports route types

In `apps/backend/src/index.ts`:

```ts
const app = new Hono()
  .get('/api/events', (c) => {
    return c.json([
      { id: 1, name: 'Event', date: '2025-06-15', type: 'wedding' }
    ])
  })

export type AppType = typeof app  // Export the app type
```

### 2. Frontend imports types as dev dependency

The frontend imports backend types **only during development** (not in production bundle):

In `apps/frontend/package.json`:
```json
{
  "devDependencies": {
    "@daybreak/backend": "workspace:*"  // Dev-only dependency
  }
}
```

In `apps/frontend/src/lib/api.ts`:
```ts
import { hc } from 'hono/client'
import type { AppType } from '@daybreak/backend'  // Type-only import

export const client = hc<AppType>('http://localhost:5173')
```

### 3. Get full type safety in hooks

In `apps/frontend/src/hooks/useEvents.ts`:

```ts
const res = await client.api.events.$get()
const data = await res.json()
// ✨ TypeScript knows exact shape: { id: number, name: string, ... }[]
```

**Key Benefits:**
- ✅ No code generation needed
- ✅ Types update instantly when you change backend routes
- ✅ Full autocomplete in frontend code
- ✅ Backend code never ships to frontend bundle
- ✅ Type errors caught at build time

## Authentication with Clerk

This project uses Clerk for authentication. The setup includes:

### Backend
- `@hono/clerk-auth` middleware protects API routes
- `getAuth(c)` retrieves the authenticated user
- Environment variables for Clerk keys

### Frontend
- `<ClerkProvider>` wraps the entire app
- `<SignedIn>` / `<SignedOut>` components for conditional rendering
- `useAuth()` hook to get auth tokens for API calls

Authentication flow:
1. User signs in via Clerk UI components
2. Frontend gets auth token via `getToken()`
3. Token sent in `Authorization` header to backend
4. Backend validates token via Clerk middleware
5. Protected routes accessible only with valid token

## Deployment

The frontend and backend can be deployed **separately** since type sharing happens only at build time.

### Backend (Hono API)

**Recommended platforms:**
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)
- [Render](https://render.com)
- AWS Lambda / ECS
- Cloudflare Workers

**Environment variables to set:**
```env
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Frontend (Vite + React)

**Recommended platforms:**
- [Vercel](https://vercel.com) - Zero-config deployment
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- AWS S3 + CloudFront

**Environment variables to set:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

**Important:** Update the API URL in `apps/frontend/src/lib/api.ts` to your production backend URL:

```ts
export const client = hc<AppType>('https://your-api-domain.com')
```

## Adding New Features

### 1. Add a new API endpoint

In `apps/backend/src/index.ts`:

```ts
.get('/api/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'John' })
})
```

### 2. Create a hook in the frontend

In `apps/frontend/src/hooks/useUser.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { client } from '@/lib/api'

export function useUser(id: string) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const token = await getToken()
      const res = await client.api.users[':id'].$get(
        { param: { id } },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return res.json()  // ✨ Fully typed!
    }
  })
}
```

### 3. Use in component

```tsx
import { useUser } from '@/hooks/useUser'

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useUser(userId)
  return <div>{user?.name}</div>  // TypeScript knows the shape!
}
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend Framework | [Hono](https://hono.dev) | Lightweight, ultrafast web framework |
| Frontend Framework | [React](https://react.dev) | UI library |
| Build Tool | [Vite](https://vitejs.dev) | Fast bundler with HMR |
| Type Safety | [Hono RPC](https://hono.dev/docs/guides/rpc) | End-to-end type inference |
| Authentication | [Clerk](https://clerk.com) | User management & auth |
| State Management | [TanStack Query](https://tanstack.com/query) | Server state & caching |
| Package Manager | [pnpm](https://pnpm.io) | Fast, efficient monorepo support |
| Language | [TypeScript](https://typescriptlang.org) | Type-safe JavaScript |

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Run both apps in parallel |
| `pnpm dev:backend` | Run backend only (port 3000) |
| `pnpm dev:frontend` | Run frontend only (port 5173) |
| `pnpm build` | Build both apps for production |
| `pnpm build:backend` | Build backend only |
| `pnpm build:frontend` | Build frontend only |

## Learn More

- [Hono Documentation](https://hono.dev)
- [Hono RPC Guide](https://hono.dev/docs/guides/rpc)
- [Clerk Documentation](https://clerk.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Vite Guide](https://vitejs.dev/guide)

## License

MIT
