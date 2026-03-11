# CSF Frontend — Next.js 14 + Tailwind + Radix UI

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Primitives**: Radix UI
- **HTTP Client**: Axios
- **Fonts**: Playfair Display (headings) + DM Sans (body)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles + animations
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── profile/
│   │   ├── [id]/page.tsx
│   │   └── edit/page.tsx
│   ├── organizations/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── enterprises/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   └── connections/page.tsx
├── components/
│   ├── ui/                           # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   └── toaster.tsx
│   └── layout/
│       ├── navbar.tsx
│       ├── footer.tsx
│       └── main-layout.tsx
├── context/
│   └── AuthContext.tsx               # Auth state + JWT management
├── lib/
│   ├── api.ts                        # Axios client + all API calls
│   └── utils.ts                      # cn(), helpers, label maps
└── types/
    └── index.ts                      # All TypeScript types
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to your NestJS backend URL (default: `http://localhost:3001/api/v1`).

### 3. Start dev server
```bash
npm run dev
```
App runs at `http://localhost:3000`

## Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page | Public |
| `/auth/login` | Login | Public |
| `/auth/register` | Register | Public |
| `/dashboard` | User dashboard | Protected |
| `/profile/:id` | User profile | Public |
| `/profile/edit` | Edit profile | Protected |
| `/organizations` | Browse organizations | Public |
| `/organizations/create` | Create organization | Protected |
| `/organizations/:id` | Organization detail | Public |
| `/enterprises` | Browse enterprises | Public |
| `/enterprises/create` | Register enterprise | Protected |
| `/enterprises/:id` | Enterprise detail | Public |
| `/connections` | My connections | Protected |

## Design System
- **Primary color**: Brand green (`#2e9168`)
- **Secondary color**: Sand (`#d98a2a`)
- **Border radius**: 12px (cards), 8px (inputs)
- **Shadows**: Soft layered shadows
- **Animations**: Fade-up on page load, card-lift on hover
