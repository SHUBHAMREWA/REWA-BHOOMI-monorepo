# Rewa Bhoomi — Real Estate Marketplace

> **Production-ready** real estate platform for Rewa, Madhya Pradesh.

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Material UI |
| Backend | Express.js, TypeScript, Node.js |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Media | Cloudflare R2 |
| Real-time | Socket.IO |
| Video/Audio | WebRTC |

## 📁 Project Structure

```
rewa-bhoomi/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Shared Zod schemas
│   └── config/       # Shared constants
├── docker/           # Docker Compose files
└── docs/             # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL + Redis)

### 1. Clone and install

```bash
git clone <repo-url>
cd rewa-bhoomi
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start services (PostgreSQL + Redis)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
```

> Default super admin: `admin@rewabhoomi.com` / `Admin@1234!`

### 5. Start development servers

```bash
pnpm dev:api   # API on http://localhost:4000
pnpm dev:web   # Web on http://localhost:3000
```

## 📋 Implementation Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Foundation | Monorepo, Express, Next.js, DB, Auth middleware |
| 2 | ✅ Authentication | Register, Login, Google OAuth, JWT, Reset Password |
| 3 | ✅ Properties | CRUD, Search, Filters, Favorites, Pagination |
| 4 | 🔜 Media | Cloudflare R2, Image upload, Optimization |
| 5 | 🔜 Admin | Dashboard, User management, Moderation |
| 6 | 🔜 Projects | Plot maps, Heat maps, Interactive map |
| 7 | 🔜 Blogs + SEO | CMS, JSON-LD, Sitemap |
| 8 | 🔜 Notifications + PWA | Push notifications, Service Worker |
| 9 | 🔜 Chat | WebSocket, Real-time messaging |
| 10 | 🔜 WebRTC | Audio/video calling |
| 11 | 🔜 Groups | Admin groups, Group messaging |

## 📚 Documentation

See `docs/` for detailed documentation.

## 🔐 Security

- Argon2id password hashing
- JWT with short-lived access tokens (15min)
- HttpOnly refresh token cookies
- RBAC (USER / ADMIN / SUPER_ADMIN)
- Rate limiting per endpoint
- Input validation with Zod
- SQL injection protection

## 📄 License

Private — All rights reserved.
