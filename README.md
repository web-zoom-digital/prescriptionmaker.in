# PrescriptionMaker

**Production-grade digital prescription platform**

**Domain:** [prescriptionmaker.in](https://prescriptionmaker.in)

---

## Monorepo Structure

```
prescriptionmaker.in/
├── apps/
│   ├── web/          # Next.js 15 website (App Router)
│   ├── admin/        # Admin dashboard (Next.js)
│   ├── mobile/       # React Native (Expo) — Phase 2
│   └── extension/    # Browser extension (MV3) — Phase 2
│
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Zod validation schemas
│   ├── config/       # Templates, plans, constants
│   ├── ui/           # Shared UI components — Phase 2
│   ├── api/          # API client contracts — Phase 2
│   ├── auth/         # Shared auth logic — Phase 2
│   └── editor-core/  # Prescription editor logic — Phase 2
│
└── backend/          # Node.js API (Supabase-backed)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT + HTTP-only cookies |
| PDF | @react-pdf/renderer |
| Canvas Editor | Fabric.js / Canvas API |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install

```bash
pnpm install
```

### Environment Variables

Copy the example env files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp backend/.env.example backend/.env
```

### Development

```bash
# All apps
pnpm dev

# Web only
pnpm dev:web

# Backend only
pnpm dev:backend
```

### Build

```bash
pnpm build
```

---

## Environment Variables

See [apps/web/.env.example](./apps/web/.env.example) for required variables.

---

## License

Proprietary — All rights reserved. © PrescriptionMaker 2024
