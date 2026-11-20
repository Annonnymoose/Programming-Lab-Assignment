# 02 — Screen Specifications & User Interface Design

This document details the layout, state requirements, interactive components, bilingual keys, and edge cases across the **7 core screens**.

---

## Screen 1: Home (`/`) — Salon Lobby & Overview
**Context:** Public-facing mobile or desktop landing page. First touchpoint for arriving or remote customers.

### Layout & Elements
- **Header:**
  - Salon Brand Logo + Name: *"The Royal Salon / ધ રોયલ સલૂન"*
  - Real-time Status Badge:
    - If Open: Green pill with pulsing dot: `Open · Closes 9 PM` / `ખુલ્લું છે · રાત્રે ૯ વાગ્યે બંધ થશે`
    - If Closed / Past 8:30 PM: Gray/Red pill: `Closed for new entries` / `નવા પ્રવેશ માટે બંધ છે`
  - Language Switcher Button (`EN` / `ગુજરાતી`)
  - Subtle Staff Lock Icon (Quick route to PIN modal for staff members)
- **Live Queue Summary Hero Card:**
  - Dark surface card (`#111827`) with gold accent border.
  - Large stat metrics:
    - `"X people waiting · about Y min"` / `"X ગ્રાહકો રાહ જોઈ રહ્યા છે · આશરે Y મિનિટ"`
    - If 0 waiting: `"No wait right now · Walk right in!"` / `"હાલમાં કોઈ પ્રતીક્ષા નથી · તરત જ પધારો!"`
    - If all active barbers on break: `"Queue temporarily paused"` / `"કતાર અસ્થાયી રૂપે થોભાવેલ છે"`
- **Barber Station Status Chips:**
  - Horizontal scrollable or flex wrap of 3 seed barbers: **Ravi**, **Amit**, **Imran**
  - Status indicators:
    - `Available` / `ઉપલબ્ધ` (Emerald dot)
    - `Busy (S-XX)` / `કાર્યરત (S-XX)` (Amber dot)
    - `On break` / `વિરામ પર` (Muted red dot)
- **Primary Call to Action:**
  - Fixed or sticky bottom button on mobile:
  - Gold background (`#D4A017`), black bold text, minimum 52px height.
  - Text: `[ Join Queue ]` / `[ લાઈનમાં જોડાવો ]`
  - Action: Navigates to `/join`. If online queue is closed, button is disabled with explanatory tooltip.

---

## Screen 2: Join Queue (`/join`) — Mobile-First Self-Service
**Context:** Customer's smartphone. Streamlined 30-second form to enter the queue.

### Layout & Validation
- **Online Joining Cutoff Check:**
  - If current time $\ge$ 8:30 PM or Owner toggled queue to `Closed`:
    - Display prominent warning banner: *"Online joining is closed for today. Walk-ins at the salon reception are still accepted until 9:00 PM."*
    - Disable submission fields and hide `[ Confirm ]` button.
- **Form Controls:**
  1. **Customer Name Input:**
     - Text field, autofocus, min 2 characters, trimmed.
     - Placeholder: *"Enter your full name"* / *"તમારું પૂરું નામ લખો"*
  2. **Phone Number Input:**
     - 10-digit numeric keypad (`inputmode="tel"`).
     - Validation: Indian mobile format (`^[6-9]\d{9}$`).
     - **Active Token Guard:** Before creating token, checks if an active token (`Waiting`, `Called`, or `In chair`) already exists for this phone number. If found, displays error modal: *"You already have an active token (#S-X)"* with a direct button: `[ Go to My Status ]`.
  3. **Multi-Select Service Cards (1 to 3 items):**
     - Grid of active services from database:
       - Haircut / હેરકટ (30 min, ₹150)
       - Beard trim / દાઢી ટ્રિમ (15 min, ₹80)
       - Hair spa / હેર સ્પા (45 min, ₹400)
     - Interactive checkbox/card toggle with gold border when selected.
     - Validation: Minimum 1 service, maximum 3 services selected.
  4. **Barber Preference Selector:**
     - Options:
       - `Any barber (fastest)` / `કોઈપણ બાર્બર (સૌથી ઝડપી)` (Default)
       - Individual Barber Cards: Ravi, Amit, Imran.
     - If a barber is currently `On break`, the card displays a badge: `"[Barber] is on break"` / `"[બાર્બર] વિરામ પર છે"` and disables selection or shows a wait extension notice.
- **Dynamic Live Summary Sticky Footer Card:**
  - Calculates in real-time:
    - **Total Duration:** Sum of selected service durations (e.g., `45 min`).
    - **Total Price:** Sum of prices (e.g., `₹230`).
    - **Estimated Wait Time:** Calculated via shared `queueEngine`.
  - `[ Confirm & Join Queue ]` / `[ કન્ફર્મ કરો અને લાઈનમાં જોડાવો ]`:
    - Full-width, 48px tap target.
    - Generates unique token (e.g., `S-14`), persists record to Supabase, saves token ID to `localStorage` for returning visitor convenience, and redirects to `/status/:id`.

---

## Screen 3: My Status (`/status/:id`) — Live Client Ticket
**Context:** Customer's personal tracking screen on their phone. Automatically updates without page refreshes.

### Visual States & Behaviors
1. **Persistent Header:**
   - Small salon brand mark, live sync pulse indicator ("Connected"), and Share/Bookmark hint.
2. **Main Ticket Display:**
   - Giant Gold Token Pill: e.g., **`S-14`** (Font size ~3rem, bold).
   - Customer name, selected services list, and designated or assigned barber.
3. **Queue Position & Circular Countdown:**
   - Queue position badge: e.g., `"2nd in line"` / `"લાઈનમાં બીજો નંબર"`.
   - SVG Animated Circular Progress Ring displaying estimated remaining minutes (e.g., `18 min`).
   - If active barbers = 0: Shows `"Paused — all barbers on break"`.
4. **Context-Sensitive Alert Banners:**
   - **When 2nd in Line (`position === 2`):**
     - Amber notification banner at top:
     - *"Start coming to the salon! You're next after the current customer."* / *"સલૂન તરફ આવવાનું શરૂ કરો! તમે આગામી ગ્રાહક પછી તરત જ છો."*
   - **When Status is `Called`:**
     - Full-screen gold modal alert with gentle breathing pulse animation.
     - Headline: *"It's your turn! Go to [Barber Name]"* / *"તમારો વારો આવી ગયો છે! કૃપા કરીને [બાર્બરનું નામ] પાસે જાઓ"*.
     - Triggers mobile haptic vibration: `navigator.vibrate([200, 100, 200, 100, 300])`.
   - **When Status is `In chair`:**
     - Emerald banner: *"You are currently being served by [Barber Name]. Relax and enjoy!"*
     - Live elapsed timer of the service.
   - **When Status is `Done`:**
     - Clean thank-you message with service summary and prompt to rate or return home.
5. **Cancellation Action:**
   - Text link / Button at bottom: `[ Cancel my spot ]` / `[ મારી જગ્યા રદ કરો ]`.
   - Opens confirmation modal: *"Are you sure you want to cancel your spot in line?"*.
   - On confirmation, updates status to `Cancelled` and redirects to `/`.

---

## Screen 4: Reception Dashboard (`/reception`) — Tablet Dispatch Hub
**Context:** Reception desk 10-inch tablet in landscape orientation. High information density. Protected by PIN `1234`.

### Layout & Workflow
- **Top Navigation Bar:**
  - Salon Status Badge (`Open` / `Closed`), Live Clock (`HH:MM:SS`), Online Queue Status indicator.
  - Primary CTA: `[ + Add Walk-in Customer ]` (Prominent gold button).
  - Language toggle, Barber quick link, Staff Logout.
- **Walk-in Modal Dialog:**
  - Quick entry form (Name, 10-digit Phone, Service checkboxes, Barber preference).
  - Walk-in allowed anytime during business hours (even after 8:30 PM online cutoff).
  - Generates token immediately and inserts into queue.
- **Two-Column Master-Detail Layout:**
  - **Left Column (Barber Chairs Station - 40% width):**
    - 3-card stack/grid representing Ravi, Amit, Imran.
    - Each Barber Card shows:
      - Barber Name & Availability Toggle (`Available` / `On break`).
      - Current Client in Chair: Token ID (e.g., `S-12`), Client Name, Services.
      - Service Progress Bar: Visual elapsed vs. expected duration indicator.
      - Action Button:
        - If Barber is Free: Prominent `[ Call Next ]` button. Tapping invokes `queueEngine.matchNextCustomer(barberId)`, transitioning the customer to `Called`.
        - If Barber is Serving: `[ In Chair ]` badge with elapsed timer.
  - **Right Column (Live Waiting Queue - 60% width):**
    - Sorted list of all customers with status `Waiting` or `Called`.
    - Each row displays:
      - Token ID (`S-14`), Customer Name, Phone number (masked for privacy: `******1234`).
      - Services tags with durations, Preferred barber tag (`Any` or `Ravi`).
      - Wait duration counter (time elapsed since joining).
      - **Amber Highlight Alert:** If waiting duration $> 60$ minutes, the row displays an amber pulsing border to alert receptionists of extended delays.
      - Quick Row Actions:
        - `[ Call ]` (if available barber matches).
        - `[ No-show ]` (marks status `No-show` and removes from active queue).
        - `[ Cancel ]` (with quick confirmation).

---

## Screen 5: Barber View (`/barber/:name`) — Barber Mobile Station
**Context:** Smartphone mounted at each barber's mirror/workstation. PIN-protected.
Dynamic route: `/barber/ravi`, `/barber/amit`, `/barber/imran`.

### Layout & Sequential Operations
- **Header:**
  - Barber Name & Station ID (e.g., *Ravi · Station 1*).
  - Status Toggle Pill: `Available` (Green) $\leftrightarrow$ `On break` (Orange/Red).
- **Current Customer Work Card (Active Service):**
  - If no customer assigned:
    - Empty state: *"No customer in chair. Tap Call Next on Reception or await dispatch."*
  - If customer is `Called`:
    - Shows Customer Token & Name.
    - Prominent Button: `[ Start Service ]` $\rightarrow$ Transitions token to `In chair`, timestamps start time, and activates live elapsed timer.
  - If customer is `In chair`:
    - Live Stopwatch: Large `MM:SS` timer counting service duration.
    - Selected services checklist (e.g., `[✓] Haircut (30m)`, `[✓] Beard trim (15m)`).
    - Completion Action:
      - Full-width Gold Button: `[ Done / Complete Service ]`.
      - Transitions token to `Done`, records total duration, and marks barber ready for next customer.
- **'Next for You' Preview Card:**
  - Preview of the upcoming customer in the waiting line assigned to this barber (or next 'Any' barber customer).
  - Displays: Token ID, Name, Services, Estimated wait remaining.

---

## Screen 6: Waiting Area TV Display (`/display`) — 5-Meter Readable Screen
**Context:** Wall-mounted 43–65 inch TV running full screen. Public display, zero touch interaction required.

### Design & Visual Hierarchy
- **Theme:** High-contrast dark charcoal (`#0F172A`), large gold numbers, crisp sans-serif font legible from $\ge 5$ meters distance.
- **Auto-Refresh & Audio Engine:**
  - WebSocket subscription triggers instant updates (< 2s).
  - **Chime & Flash Notification:** Whenever any customer token transitions from `Waiting` to `Called`:
    1. Visual Flash: The corresponding barber card pulses with a vibrant gold glow animation for 4 seconds.
    2. Audio Announcement: A pleasant, synthesized multi-tone chime plays via the browser's Web Audio API (e.g., C5-E5-G5 triad), requiring no external audio file dependencies.
- **Screen Layout Grid:**
  - **Upper Section: Active Barbers Stations:**
    - 3 large cards side-by-side (Ravi, Amit, Imran).
    - Barber photo/avatar, Barber name.
    - Large Status Display:
      - If serving: **`Now: S-12`** (Huge gold badge) + Client First Name.
      - If waiting for client: **`Calling S-14...`** (Flashing gold badge).
      - If free: Green badge **`Available`**.
      - If on break: Muted badge **`On Break`**.
  - **Lower Section: 'Up Next' Queue Strip:**
    - Horizontal or vertical cards listing the **Next 5 Tokens** in line (`S-15`, `S-16`, `S-17`, `S-18`, `S-19`).
    - Each item shows: Token Badge, Services abbreviated icons, and Estimated Wait (`~12 min`).
  - **Footer Ticker:**
    - Current Time, Salon Name in English and Gujarati, and a QR code / URL badge: *"Join queue from your phone at salon.com/join"*.

---

## Screen 7: Owner Admin & Settings (`/admin`) — Management Console
**Context:** Salon owner dashboard on laptop or mobile. Protected by PIN `1234`.

### Layout & Administrative Modules
- **Today's Operational KPI Cards:**
  - **Customers Served:** Total count of tokens marked `Done` today.
  - **Average Wait Time:** Average duration in minutes from token creation to `In chair` start.
  - **No-Show Rate:** Count and percentage of tokens marked `No-show`.
  - **Active in Queue:** Current count of `Waiting` customers.
- **Master Queue Control Switch:**
  - Large Toggle: `Online Joining: OPEN / CLOSED`.
  - Overrides the standard 8:30 PM automated cutoff for special holiday hours or early closures.
- **Barbers On Duty Today:**
  - Staff roster toggles for Ravi, Amit, and Imran.
  - Allows owner to mark a barber as `Off Duty` for the entire day (removes them from wait calculations and queue matching).
- **Service Catalog Manager:**
  - Interactive table of services with inline edit and toggle capabilities:
    - English Name (`Haircut`)
    - Gujarati Name (`હેરકટ`)
    - Duration in Minutes (`30`)
    - Price in INR (`₹150`)
    - Active Status Toggle (`Active` / `Inactive`)
  - `[ + Add New Service ]` modal to introduce seasonal or special treatments.
