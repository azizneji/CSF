# CSF Backend — NestJS + Supabase

## Stack
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Docs**: Swagger at `/api/docs`

## Project Structure

```
src/
├── main.ts                     # Entry point
├── app.module.ts               # Root module
├── supabase/                   # Shared Supabase clients
│   ├── supabase.service.ts
│   └── supabase.module.ts
├── auth/                       # Authentication (Supabase Auth + JWT)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   └── dto/auth.dto.ts
├── users/                      # Citizen profiles
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/update-profile.dto.ts
├── organizations/              # NGOs, associations, etc.
│   ├── organizations.controller.ts
│   ├── organizations.service.ts
│   ├── organizations.module.ts
│   └── dto/organization.dto.ts
├── enterprises/                # Private sector entities
│   ├── enterprises.controller.ts
│   ├── enterprises.service.ts
│   ├── enterprises.module.ts
│   └── dto/enterprise.dto.ts
├── connections/                # Polymorphic connections between actors
│   ├── connections.controller.ts
│   ├── connections.service.ts
│   ├── connections.module.ts
│   └── dto/connection.dto.ts
└── common/
    ├── guards/jwt-auth.guard.ts
    └── decorators/current-user.decorator.ts
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase credentials from your project dashboard.

### 3. Set up the database
Go to your Supabase project → SQL Editor → paste and run `supabase-schema.sql`

### 4. Start development server
```bash
npm run start:dev
```

API runs on `http://localhost:3001`
Swagger docs at `http://localhost:3001/api/docs`

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new citizen |
| POST | `/login` | — | Login |
| POST | `/logout` | ✓ | Logout |
| POST | `/refresh` | — | Refresh token |
| GET | `/me` | ✓ | Get current user |

### Users (`/api/v1/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Browse citizens |
| GET | `/:id` | — | Get user profile |
| PATCH | `/me` | ✓ | Update my profile |
| GET | `/me/organizations` | ✓ | My organizations |

### Organizations (`/api/v1/organizations`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Browse organizations |
| GET | `/:id` | — | Get organization |
| POST | `/` | ✓ | Create organization |
| PATCH | `/:id` | ✓ Admin | Update organization |
| DELETE | `/:id` | ✓ Admin | Delete organization |
| POST | `/:id/members/:userId` | ✓ Admin | Add member |
| DELETE | `/:id/members/:userId` | ✓ Admin | Remove member |

### Enterprises (`/api/v1/enterprises`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Browse enterprises |
| GET | `/:id` | — | Get enterprise |
| POST | `/` | ✓ | Register enterprise |
| PATCH | `/:id` | ✓ Owner | Update enterprise |
| DELETE | `/:id` | ✓ Owner | Delete enterprise |

### Connections (`/api/v1/connections`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✓ | Send connection request |
| PATCH | `/:id/respond` | ✓ | Accept / reject |
| GET | `/actor/:actorId` | ✓ | Get actor's connections |
| GET | `/pending` | ✓ | My pending requests |
| DELETE | `/:id` | ✓ | Remove connection |

## Supabase JWT Secret
Find it in: Supabase Dashboard → Project Settings → API → JWT Secret
