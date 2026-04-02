# PathFinderAI (Pilot Build)

PathFinderAI is a Vinschool-focused career guidance and collaboration web app.

## Core pilot modules

- Discover: guided career quiz
- Career Map: AI-assisted + deterministic roadmap generation
- Activities: curated school/partner opportunities
- Progress: saved/completed activities, achievements, reflections
- LinkUp: peer matching with intro-request workflow
- Counselor Dashboard: cohort-level visibility and exports

## Tech stack

- Next.js App Router + React
- Convex backend + auth
- Google OAuth (restricted to approved Vinschool domains)
- Gemini API for AI assistance with deterministic fallback

## Environment setup

Copy `.env.example` to `.env.local` and fill all required values.

Required variables:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `GEMINI_API_KEY`

Pilot controls:

- `ALLOWED_EMAIL_DOMAINS` (default: `stu.vinschool.edu.vn,vinschool.edu.vn`)
- `PILOT_ADMIN_EMAILS` (optional bootstrap admin emails)
- `PILOT_COUNSELOR_EMAILS` (optional bootstrap counselor emails)
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)

## Local development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Scripts

- `npm run dev` - frontend + Convex backend
- `npm run dev:frontend` - Next.js only
- `npm run dev:backend` - Convex only
- `npm run lint` - ESLint
- `npm run build` - production build
- `npm run start` - production server

## Pilot hardening included

- Role-aware auth bootstrapping from allowed domains and bootstrap email lists
- Server-side validation for quiz inputs, reflections, LinkUp text, and activity creation
- LinkUp privacy protections (emails only shown after accepted intro)
- Basic anti-abuse limits for intro requests and AI usage
- Role-gated activity creation/seeding (admin/counselor/partner)
- Counselor/admin shared access to counselor dashboard

## Known pilot constraints

- No automated test suite yet
- No in-app admin UI for role management yet (backend mutation exists)
- No production monitoring/error-reporting integration yet

## Next recommended pilot tasks

1. Add admin page for role assignment and activity moderation.
2. Add basic end-to-end smoke tests for auth, quiz, career map, LinkUp.
3. Add operational monitoring and error tracking.
