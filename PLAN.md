# Guardian Angel AI — Full-Stack Completion Plan

**Goal:** Turn the existing UI-only demo into a working full-stack app: Next.js + Supabase (Postgres/Auth/Storage/Realtime) + Gemini AI vision + Leaflet maps. Hackathon-grade: real end-to-end flows, impressive, pragmatic.

## Architecture decisions
- **One Next.js app** — API routes + Server Actions. Deploy to Vercel.
- **Supabase** for DB, auth, file storage, realtime.
- **Gemini** (`gemini-2.0-flash`) for photo distress analysis, called from a server route (key stays server-side).
- **Leaflet + OpenStreetMap** for maps; **Nominatim** for reverse-geocoding; **Overpass** for nearby hospitals/police (no key needed).
- **Keep the string-view nav for marketing/auth**, but add **real App Router routes** for authenticated areas (`/dashboard`, `/police`, etc.) + an **auth callback route** so redirects work.
- **Email confirmation OFF** in Supabase for the demo (instant signup→login). The existing verification/success screens stay as friendly UI.

---

## Phase 0 — Hygiene & dependencies
1. Fix `.gitignore` (ensure `/node_modules`, `/.next`, `.env*.local` ignored).
2. Remove committed `node_modules` from git; delete stray nested `guardian-angel-ai/` folder.
3. Install: `@supabase/supabase-js`, `@supabase/ssr`, `@google/generative-ai`, `leaflet`, `react-leaflet`, `@types/leaflet`, `date-fns`.
4. Add `.env.example` + `.env.local` (Supabase URL/anon/service keys, Gemini key).

## Phase 1 — Supabase foundation
5. `supabase/schema.sql` — tables: `profiles`, `reports`, `case_events` (timeline), `notifications`, `agencies` (nearby help / responders). Enums for role, status, priority.
6. RLS policies (citizen sees own reports; responders see cases for their role/region; admin sees all).
7. Storage bucket `report-images` (public read, authed write).
8. `supabase/seed.sql` — demo users per role, sample agencies, sample cases.
9. `lib/supabase/{client,server,middleware}.ts` (via `@supabase/ssr`) + `types/database.ts` + `types/domain.ts`.

## Phase 2 — Auth (real)
10. `AuthProvider` (context + `onAuthStateChange`) in `app/layout.tsx`; `hooks/use-auth.ts`.
11. Wire `login` → `signInWithPassword`, `register` → `signUp` + `profiles` insert (role, name, mobile), `forgot`/`reset` → real reset flow, `email-verification` resend.
12. `app/auth/callback/route.ts` for redirects; `middleware.ts` to guard `/dashboard` + role routes.
13. **Role-based redirect** after login: citizen→`/dashboard`, police→`/police`, etc.

## Phase 3 — Report flow (real)
14. Real `navigator.geolocation` + Nominatim reverse-geocode in `report-child.tsx`.
15. Real image upload to Supabase Storage (replace fake progress).
16. `app/api/analyze/route.ts` — Gemini vision on the uploaded photo → `{ageGroup, threatLevel, injuryFlag, dispatchTarget}`.
17. Insert `reports` row (+ `case_events`), store AI result; real case id from DB.

## Phase 4 — Citizen dashboard (real data)
18. Replace hardcoded user + reports with session user + live `reports` query.
19. Real "My Reports", real "AI Analysis" tab (from stored Gemini result).
20. Nearby help via Overpass API around user coords.
21. Real notifications list from DB + Supabase Realtime badge.
22. Wire AI companion chat to a Gemini chat route (optional, time-permitting).

## Phase 5 — Role dashboards (new)
23. Build `features/police`, `features/hospital`, `features/ngo`, `features/volunteer`, `features/admin` dashboards + their `app/(roles)/…` routes. Each: incoming cases for their role, case detail, **status update** (→ realtime to citizen), map of incidents. Reuse existing UI kit + `dashboard-board.tsx`.

## Phase 6 — Maps, realtime, tracking
24. `components/map/*` Leaflet wrapper (SSR-safe, dynamic import).
25. `features/tracking` — live case map + responder positions.
26. Supabase Realtime channels so status changes propagate live across dashboards.

## Phase 7 — Polish & deploy
27. Loading/empty/error states, mobile pass, seed data for a clean demo.
28. `npm run build` green; README with setup steps; deploy to Vercel.

---

## What I need from you (manual, ~10 min)
- Create a **Supabase** project → give me the Project URL + anon key + service_role key (or paste into `.env.local` yourself).
- In Supabase Auth settings, **turn off "Confirm email"** (for instant demo login).
- Create a **Google Gemini API key** (aistudio.google.com) → into `.env.local`.
- I'll give you exact SQL to paste into the Supabase SQL editor (or run it via CLI).

## Suggested build order for early wins
Phase 0 → 1 → 2 gets you **real login/signup** working fast. Then Phase 3 (real report + AI) is the demo centerpiece. Roles/maps/realtime (5–6) layer on top. We can stop at any phase and still have a working, deployable app.

## Notes / tradeoffs
- Skipping OAuth (Google/GitHub buttons) initially — email/password is enough for a demo and avoids OAuth app setup. Can add later.
- Email confirmation off = simplest reliable demo login. Can flip on for "real" mode.
- Gemini key stays server-side (API route), never shipped to client.
