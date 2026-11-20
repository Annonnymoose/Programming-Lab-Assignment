# 💈 The Royal Salon — Real-Time Queue Management System

**Live demo:** https://salon-queue-management.vercel.app  
**Staff PIN:** `1234`

---

## 🌟 Overview
**The Royal Salon Queue Management System** is a mobile-first, full-stack single-page application (SPA) built with React, Vite, TypeScript, and Tailwind CSS. It coordinates customer arrival, barber dispatch, and waiting-area notifications across multiple devices in real time with sub-second synchronization (< 50ms local / < 2s Supabase WebSocket broadcast).

The application features a 100% centralized **English & Gujarati (EN / GU)** bilingual engine and an immutable, single-source-of-truth **Queue Engine** governing all calculations and state transitions.

---

## 📱 The 7 Core Screens & Routes

| # | Route | Screen Name | Target Device & Access | Key Capabilities |
|---|---|---|---|---|
| 1 | `/` | **Home Lobby** | Mobile / Desktop (Public) | Live wait summary card, barber availability chips (`Available` / `Busy` / `On break`), and prominent gold `[ Join Queue ]` CTA. |
| 2 | `/join` | **Join Queue** | Mobile-First (Public) | Customer registration form with 10-digit phone validation, active ticket duplicate guard, 1–3 service multi-select, barber preference picker, dynamic wait/price estimation, and 8:30 PM cutoff enforcement. |
| 3 | `/status/:id` | **My Status** | Customer Smartphone (Public) | Live token badge (`S-1`, `S-2`...), SVG animated wait countdown, `'Start coming to salon'` banner (2nd in line), full-screen gold `'It's your turn!'` alert with `navigator.vibrate`, live in-chair stopwatch, and spot cancellation. |
| 4 | `/reception` | **Reception Dashboard** | 10-inch Tablet Landscape (**PIN: `1234`**) | Left column barber station cards with live progress bars and `[ Call next ]` matching; right column ordered waiting queue with wait duration counters and amber highlight for $>60\text{ min}$ delays; `[ + Add Walk-In ]` modal bypassing online cutoff. |
| 5 | `/barber/:name` | **Barber View** | Barber Smartphone (**PIN: `1234`**) | Workstation mirror view for Ravi, Amit, and Imran; live stopwatch for current client in chair; sequential `[ Start ]` $\rightarrow$ `[ Done ]` service actions; 'Next for you' client preview; and `Available` $\leftrightarrow$ `On break` toggle. |
| 6 | `/display` | **Waiting Area TV** | Wall-Mounted 43–65" TV (Public) | 5-meter readability layout; active barber stations row (`Now: S-XX`, `Available`, `On break`); 'Up Next' strip showing next 5 waiting tokens; visual gold flare pulse + synthesized Web Audio API chime on customer calls. |
| 7 | `/admin` | **Owner Settings** | Owner Laptop / Mobile (**PIN: `1234`**) | Today's KPI cards (Served, Average Wait, No-Shows, Active); 3-way master queue switch (`Auto 8:30 PM`, `Force Open`, `Force Closed`); staff on-duty roster toggles; and Service Catalog Manager (add/edit EN & GU names, duration, price, active toggles). |

---

## ⚙️ Technology Stack

- **Frontend Framework:** React 18 / 19, TypeScript, Vite 6
- **Routing:** React Router DOM v6 with client-side SPA architecture
- **Styling & Theme:** Tailwind CSS with Dark Charcoal base (`#1F2937`), Card Surfaces (`#111827`, `#374151`), and Warm Salon Gold accents (`#D4A017` / `#EAB308`)
- **Real-Time Sync Engine:** Native Supabase client (`@supabase/supabase-js`) with `postgres_changes` fallback-paired with multi-tab `BroadcastChannel` and `localStorage` event broadcasting (< 50ms latency)
- **Audio Engine:** Web Audio API (`AudioContext`) synthesized bell chime (587Hz $\rightarrow$ 880Hz harmonic decay) requiring zero external audio assets
- **Target Hosting:** Vercel (configured with `vercel.json` SPA rewrite)

---

## 🔒 Security & Access Control

Staff-only screens are protected behind a 4-digit PIN security gate:
- **Default PIN:** `1234`
- **Protected Routes:** `/reception`, `/barber/:name`, `/admin`
- **Persistence:** Authenticated state is persisted in browser `sessionStorage` (`salon_staff_auth = true`) to prevent staff from being logged out on tab reloads.

---

## 🧠 Central Queue Engine Rules

All queue state transitions, matching algorithms, and time estimations are encapsulated in `src/lib/queueEngine.ts` and `src/context/QueueContext.tsx`:

1. **Strictly One-Way Status Lifecycle:**
   ```
   Waiting ──► Called ──► In chair ──► Done
      │           │
      ▼           ▼
   Cancelled   No-show
   ```
   Status mutations are monotonic. Reverse transitions or invalid state hops are strictly prohibited.
2. **First-Come, First-Served & Strict Barber Isolation:**
   - Tapping `[ Call next ]` for Barber X selects the earliest customer who requested Barber X or `'Any'`.
   - A customer who chose a specific barber (e.g. Amit) is **never** assigned to another barber (e.g. Ravi).
   - Each barber serves at most one customer in the chair at a time.
3. **Estimated Wait Formula:**
   $$\text{Estimated Wait (minutes)} = \begin{cases} 
   \text{"Paused — all barbers on break"}, & \text{if Active Barbers} = 0 \\
   \left\lceil \frac{\text{Total Minutes Ahead}}{\text{Active Barbers}} \right\rceil, & \text{if Active Barbers} > 0 
   \end{cases}$$
4. **Duplicate Phone & No-Show Re-Add:**
   - Enforces at most **one active token** (`Waiting`, `Called`, or `In chair`) per 10-digit mobile number (`^[6-9]\d{9}$`). Attempting to join again redirects to their existing `/status/:id`.
   - If a customer marked `No-show` returns to the salon, they cannot resume their prior ticket; they are issued a **new sequential token** at the **end** of the line.
5. **Operating Hours & Walk-In Overrides:**
   - Closing time is 9:00 PM; online joining closes at 8:30 PM (30 minutes prior).
   - Receptionists can add walk-in customers on `/reception` at any time up until 9:00 PM closing.
   - The Salon Owner can override queue status in `/admin` (`Auto`, `Force Open`, or `Force Closed`).

---

## 🌐 Bilingual Architecture (EN / GU)

- Single centralized dictionary in `src/lib/translations.ts` containing 158 verified string pairs in English and Gujarati.
- Zero hardcoded customer or staff strings in any component.
- Switchable via persistent header toggle stored in `localStorage.getItem('salon_lang')`.
- All mobile interactive elements maintain a minimum touch target size of **$44\text{px} \times 44\text{px}$** (`.tap-target` & `min-h-touch`).

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/Annonnymoose/Programming-Lab-Assignment.git
cd Salon_management_system
npm install
```


### 2. Start Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## ☁️ Vercel Deployment

The repository includes a production-ready `vercel.json` configured with SPA routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploying via Vercel CLI
```bash
npm install -g vercel
vercel
```

Or connect the repository on [vercel.com](https://vercel.com) for automatic CI/CD deployments on `git push`. Direct navigation and page reloads on dynamic routes (e.g., `/reception`, `/status/S-1`, `/barber/ravi`) work without 404 errors.

---

## ✅ 10-Item Verification Matrix

| # | Test Scenario | Verified Pass Criteria | Result |
|:---|:---|:---|:---:|
| **T-01** | **8:30 PM Online Cutoff & Reception Walk-In** | At 8:30 PM, `/join` disables submission; reception walk-in modal remains fully operational. | **PASS** |
| **T-02** | **Duplicate Phone Validation & Redirect** | Existing active phone numbers are rejected on `/join` and offered one-click redirect to `/status/:id`. | **PASS** |
| **T-03** | **Specific Barber Assignment Isolation** | Customers choosing Amit are strictly never assigned to Ravi or Imran. | **PASS** |
| **T-04** | **'Any Barber' FIFO Matching** | Earliest waiting customer is assigned to the next available free barber. | **PASS** |
| **T-05** | **Real-Time Cross-Device Sync (< 5s)** | State updates propagate across Customer, Reception, Barber, and TV in $< 50\text{ms}$. | **PASS** |
| **T-06** | **TV Chime & Visual Notification** | Calling a customer triggers a Web Audio API bell chime and a 4.5s gold pulsing flare on TV. | **PASS** |
| **T-07** | **Staff PIN Security Gate** | PIN `1234` protects staff routes (`/reception`, `/barber/:name`, `/admin`) with `sessionStorage` persistence. | **PASS** |
| **T-08** | **Strict One-Way Status Progression** | Tokens progress strictly `Waiting` $\rightarrow$ `Called` $\rightarrow$ `In chair` $\rightarrow$ `Done`. | **PASS** |
| **T-09** | **Zero Active Barbers Wait Calculation** | Displays `"Paused — all barbers on break"` without divide-by-zero or NaN errors. | **PASS** |
| **T-10** | **Bilingual Toggle & 44px Tap Target Audit** | 100% key parity across EN & GU without layout clipping; all mobile controls measure $\ge 44\text{px}$. | **PASS** |
