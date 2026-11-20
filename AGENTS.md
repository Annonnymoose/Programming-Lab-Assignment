# Salon Queue Management System — Agent Directives & Architecture

## Overview
A full-stack, mobile-first, bilingual (English / Gujarati) Salon Queue Management System built with React, Vite, Tailwind CSS, and real-time state synchronization via Supabase. The system coordinates customer queueing across mobile phones, a reception tablet, barber mobile views, and a waiting area TV display.

## Technology Stack & Environment
- **Frontend Framework:** React (Vite, TypeScript, Tailwind CSS)
- **Database & Sync:** Supabase (PostgreSQL with Realtime postgres_changes broadcast)
- **Deployment Platform:** Vercel (SPA routing handled via `vercel.json` rewrite: `"/(.*)" -> "/index.html"`)
- **Theme Palette:**
  - Background: Dark Charcoal (`#1F2937`)
  - Accent / Primary CTA: Warm Gold (`#D4A017` / `#EAB308`)
  - Secondary Darks: Surface Charcoal (`#111827`, `#374151`)
  - Text: Off-white (`#F9FAFB`), Muted Slate (`#9CA3AF`)
  - Alerts: Emerald Green (Available / Success), Amber (Warning / >60 min wait), Rose Red (No-show / Cancelled)
- **Mobile UX Standards:**
  - Mobile-first responsive layouts
  - Minimum tap target size of `44px` on interactive mobile elements
  - Touch-friendly card selection and persistent bottom action bars

## Bilingual Architecture (EN / GU)
- **Requirement:** Zero hardcoded customer-facing or staff-facing strings in UI components.
- **Implementation:** Single translation source (`src/lib/translations.ts`) exporting structured key-value pairs for `EN` and `GU`.
- **Language Switcher:** Persistent toggle in navigation header stored in `localStorage` (`salon_lang: 'EN' | 'GU'`).
- **Data Coverage:** UI labels, headings, buttons, notifications, error messages, empty states, and seed service titles.

## Central Queue Engine Rule
- **Single Source of Truth:** All queue calculations, status transitions, barber matching algorithms, and wait estimates MUST reside in a single shared module (`src/lib/queueEngine.ts`).
- **No Inline Business Logic:** Screen components must import calculation and state transition functions from this module, guaranteeing consistent behavior across all 7 screens.

## Security & Access Control
- **Staff Access:** Protected by a 4-digit PIN modal (`1234`), stored in `sessionStorage` (`salon_staff_auth = true`) to prevent logout on page refresh.
- **Protected Routes:** `/reception`, `/barber/:name`, `/admin`
- **Public Routes:** `/`, `/join`, `/status/:id`, `/display`

## Strict "Don't Build" Boundaries
- NO online payment gateways or billing processing
- NO future-date scheduling or calendar bookings (today's live queue only)
- NO SMS or WhatsApp automated external messaging
- NO customer loyalty points or marketing engines
- NO multi-branch or franchise tenancy

## Documentation Map
Detailed operational specifications are organized in the `docs/` folder:
- [01-brief.md](file:///d:/College_Work/Programming%20Lab%20Work/Salon_management_system/docs/01-brief.md) — System brief, personas, database sync choice, seed data, and scope boundaries.
- [02-screens.md](file:///d:/College_Work/Programming%20Lab%20Work/Salon_management_system/docs/02-screens.md) — Complete UX/UI and data specs for all 7 routes.
- [03-flows-rules.md](file:///d:/College_Work/Programming%20Lab%20Work/Salon_management_system/docs/03-flows-rules.md) — State machine lifecycle, barber matching, wait time formulas, duplicate prevention, and 10-item test checklist.
