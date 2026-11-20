# 01 — Project Brief & Architecture Specification

## 1. Executive Summary
The **Salon Queue Management System** is a real-time, responsive single-page web application (SPA) designed to eliminate physical waiting lines in salons. It coordinates queue operations across five core personas and device contexts:
1. **Remote Customers (Smartphone):** Check live wait times from anywhere, join the virtual line, and monitor queue progress.
2. **Receptionist (10-inch Tablet Landscape):** Manage both walk-in and online arrivals, monitor barber station progress, and dispatch the waiting list.
3. **Barbers (Smartphone):** View active clients, run live service timers, signal completions, and manage personal break availability.
4. **Waiting Area Visitors (Wall-Mounted TV):** View high-contrast queue status, upcoming tokens, and hear visual/audio chimes when called.
5. **Salon Owner / Manager (Admin):** Configure services, toggle staff on duty, oversee daily KPIs, and manage the master queue switch.

---

## 2. Real-Time Sync Engine: Choice & Environment Keys

### The Choice: Supabase (PostgreSQL + Realtime)
**Recommendation:** **Supabase** is selected for the queue engine because its relational schema models customers, services, and barbers with atomic transactions and explicit foreign keys, while its native WebSocket Realtime engine (`postgres_changes`) provides sub-second event broadcasts across all screens with minimal client overhead. This guarantees all 4 device views stay synchronized under 5 seconds without polling.

### Required Environment Configuration
Add the following keys to your project root `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*(Note: An offline resilient memory/localStorage fallback mock-adapter is also embedded into the client so the app runs smoothly during development and local testing if credentials are not yet configured).*

---

## 3. Operating Defaults & Seed Data

### 3.1 Salon Operating Schedule
- **Salon Closing Time:** `9:00 PM`
- **Online Joining Cutoff:** `8:30 PM` (strictly 30 minutes before closing; online join button disabled with explanatory banner).
- **Owner Override:** The Salon Owner can toggle the master queue switch (`Open` / `Closed`) in `/admin` to bypass or enforce cutoffs.
- **Walk-in Exception:** Receptionists can add walk-in customers on `/reception` at any time up until official closing, even after online queue joining closes.

### 3.2 Seed Barbers
All barbers default to status `Available` and `on_duty = true`:
1. **Ravi** — ID: `barber-1` | Default Status: `Available`
2. **Amit** — ID: `barber-2` | Default Status: `Available`
3. **Imran** — ID: `barber-3` | Default Status: `Available`

### 3.3 Seed Services
Pre-seeded catalog loaded into database/storage:
| ID | Service Name (EN) | Service Name (GU) | Duration | Price | Status |
|---|---|---|---|---|---|
| `srv-1` | Haircut | હેરકટ | 30 min | ₹150 | Active |
| `srv-2` | Beard trim | દાઢી ટ્રિમ | 15 min | ₹80 | Active |
| `srv-3` | Hair spa | હેર સ્પા | 45 min | ₹400 | Active |

---

## 4. Security & Staff Authentication
- **Access Gate:** A clean 4-digit numeric keypad modal gates access to:
  - `/reception`
  - `/barber/:name`
  - `/admin`
- **Default PIN:** `1234`
- **Persistence:** Stored in browser `sessionStorage` (`salon_staff_auth = true`) so refreshing the tab or navigating between staff screens does not trigger re-authentication. Closing the browser session expires the access.
- **Public Routes:** `/`, `/join`, `/status/:id`, and `/display` require no authentication.

---

## 5. Visual Identity & Mobile UX Standards
- **Color Palette:**
  - Background Base: `#1F2937` (Tailwind Gray-800 / Dark Charcoal)
  - Secondary Card Surface: `#111827` (Tailwind Gray-900) & `#374151` (Gray-700)
  - Brand Accent: `#D4A017` / `#EAB308` (Warm Salon Gold)
  - Text Primary: `#F9FAFB` (Off-White)
  - Text Muted: `#9CA3AF` (Cool Gray)
  - Indicators: Green `#10B981` (Available / On Time), Amber `#F59E0B` (Busy / >60m wait), Red `#EF4444` (On break / Cancelled)
- **Ergonomics & Touch targets:**
  - All interactive buttons, cards, and toggles have a minimum tap target of `44px × 44px`.
  - Mobile layouts prioritize thumb-zone actions with sticky bottom action bars.
  - Gujarati typography is verified with adequate line-height (`leading-relaxed`) to prevent glyph clipping.

---

## 6. Strict "Don't Build" Boundaries
To maintain focus on core queue velocity and operational simplicity:
- **NO Online Payments:** Customers pay at the counter upon completion.
- **NO Future Appointments:** Same-day virtual queue only; no calendar date pickers.
- **NO SMS / WhatsApp APIs:** Status is tracked directly via `/status/:id` live link.
- **NO Loyalty Programs:** No points, coupons, or user account registrations.
- **NO Multi-Branch Support:** Single salon unit operation.
