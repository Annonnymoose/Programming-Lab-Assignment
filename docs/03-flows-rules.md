# 03 — Queue Engine Rules, State Transitions & Test Checklist

All business rules, queue state mutations, matching algorithms, and time estimations are encapsulated within a single shared module: `src/lib/queueEngine.ts`. No UI component may implement independent queue calculation or state transition logic.

---

## 1. Central Queue Engine Architecture (`src/lib/queueEngine.ts`)

### 1.1 Strictly One-Way Status Lifecycle
The lifecycle of every queue token is strictly monotonic. Once a status is transitioned, it can never regress to a prior state.

```
                    ┌──────────────┐
                    │   Waiting    │
                    └──────┬───────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │ (Cancelled by customer or reception)
             ▼                           ▼
     ┌──────────────┐            ┌──────────────┐
     │    Called    │            │  Cancelled   │ [Terminal]
     └──────┬───────┘            └──────────────┘
            │
      ┌─────┴─────┐
      │           │ (Customer failed to appear)
      ▼           ▼
┌───────────┐ ┌───────────┐
│ In chair  │ │  No-show  │ [Terminal]
└─────┬─────┘ └───────────┘
      │
      ▼
┌───────────┐
│   Done    │ [Terminal]
└───────────┘
```

#### Allowed State Transitions:
1. `Waiting` $\rightarrow$ `Called` (via Barber or Reception `[ Call next ]`)
2. `Waiting` $\rightarrow$ `Cancelled` (via Customer `/status/:id` or Reception `[ Cancel ]`)
3. `Called` $\rightarrow$ `In chair` (via Barber `[ Start ]`)
4. `Called` $\rightarrow$ `No-show` (via Reception or Barber `[ No-show ]`)
5. `In chair` $\rightarrow$ `Done` (via Barber `[ Done ]`)

#### Forbidden Transitions:
- `In chair` $\rightarrow$ `Called` or `Waiting` (Illegal)
- `Done` $\rightarrow$ Any prior state (Illegal)
- `Cancelled` or `No-show` $\rightarrow$ `Waiting` (Illegal; must generate a brand new token)

---

## 2. Queue Matching & FIFO Dispatch Algorithm

When a barber taps `[ Call next ]` on `/reception` or triggers dispatch:

1. **Barber Availability Guard:**
   - Ensure the calling barber is currently `on_duty = true` and `status === 'Available'` (not `On break` and not already serving a client `In chair`).
   - A barber may serve at most **one** client in the chair at any time.

2. **Customer Matching Order:**
   - Query all tokens with status `Waiting` ordered by `created_at ASC` (First-Come, First-Served).
   - Find the first token where:
     $$\text{preferred\_barber\_id} === \text{calling\_barber\_id} \quad \text{OR} \quad \text{preferred\_barber\_id} === \text{'ANY'}$$
   - **Strict Isolation Rule:** A customer who selected a specific barber (e.g., `Amit`) will **NEVER** be matched or assigned to another barber (e.g., `Ravi`), even if Ravi has been idle for an extended period.
   - A customer who selected `'ANY'` is eligible for the first barber who calls next.

3. **Atomic Transition:**
   - The matched token's status transitions immediately to `Called`.
   - `assigned_barber_id` is set to the calling barber.
   - `called_at` timestamp is recorded.

---

## 3. Wait Time & Position Calculation Engine

### 3.1 Estimated Wait Time Formula
Estimated wait time for an individual token $T$ in the queue is calculated dynamically based on the total workload of active tokens ahead of $T$:

$$\text{Active Barbers} = \sum (\text{barbers with } \text{on\_duty} = \text{true} \land \text{status} \ne \text{'On break'})$$

$$\text{Service Time Ahead} = \sum_{t \in \text{Tokens Ahead}} (\text{Sum of service durations for token } t)$$

$$\text{Estimated Wait (minutes)} = \begin{cases} 
\text{"Paused — all barbers on break"}, & \text{if Active Barbers} = 0 \\
\left\lceil \frac{\text{Service Time Ahead}}{\text{Active Barbers}} \right\rceil, & \text{if Active Barbers} > 0 
\end{cases}$$

### 3.2 Tokens Ahead Definition
- For a specific customer's token $T$:
  - If $T$ selected a specific barber $B$, "Tokens Ahead" includes all earlier tokens assigned to $B$ or `'ANY'` ahead of $T$.
  - If $T$ selected `'ANY'`, "Tokens Ahead" includes all earlier unserved tokens.
  - Any customer currently `In chair` has their remaining estimated service time added to the numerator:
    $$\text{Remaining Time} = \max(0, \text{Scheduled Duration} - \text{Elapsed Minutes})$$

---

## 4. Duplicate Phone & Re-Add Protocol

### 4.1 Single Active Token Rule
- Validation Regex: Indian 10-digit mobile `^[6-9]\d{9}$`.
- **Constraint:** At any given moment, a phone number may only have **one** active token.
  - Active Token Statuses: `Waiting`, `Called`, or `In chair`.
- If a user enters an active phone number on `/join`:
  1. The creation is rejected.
  2. The UI displays: *"You already have an active ticket in line (#S-X)"*.
  3. Provides a one-click button redirecting directly to `/status/:id`.

### 4.2 Re-Adding No-Show or Cancelled Customers
- If a customer whose token was marked `No-show` or `Cancelled` returns to the salon:
  - They cannot "un-cancel" or resume their old position.
  - Reception or the customer must submit a new entry.
  - The system issues a **new sequential token** (e.g., `S-25`), placed strictly at the **end** of the current waiting queue.

---

## 5. Salon Hours, Cutoffs & Walk-In Overrides

- **Standard Closing Time:** `9:00 PM`
- **Online Joining Cutoff:** `8:30 PM` (30 minutes prior to closing).
- **Online Join Enforcement:**
  - When system time $\ge$ 8:30 PM, the `/join` form disables submission and informs the customer: *"Online queue is closed for today. Walk-ins accepted at reception until 9:00 PM."*
- **Owner Admin Override:**
  - The Salon Owner can toggle `master_queue_status` to `Closed` or `Open` in `/admin`.
  - When set to `Closed`, online joining closes immediately regardless of time.
  - When manually set to `Open` past 8:30 PM, online joining is re-enabled.
- **Reception Walk-in Exception:**
  - Receptionists on `/reception` can add walk-in customers at any time up until 9:00 PM closing, even when online joining is closed.

---

## 6. Bilingual System & Localization Engine

- **Dictionary Source:** `src/lib/translations.ts`
- **Supported Languages:** `EN` (English) and `GU` (ગુજરાતી).
- **Storage:** Persisted across visits in `localStorage.getItem('salon_lang')` (defaults to `EN`).
- **Zero Hard-coded Strings Rule:**
  - Every UI element (headings, labels, placeholders, buttons, badges, status chips, confirmation dialogs, toast messages) must read from the translation dictionary via `t('key')`.
  - All services must support localized names (`name_en` and `name_gu`).
  - Text layout must use flexible container styling (`min-w`, `leading-relaxed`) to prevent Gujarati character ascender/descender truncation or button text wrapping.

---

## 7. 10-Item Verification & Test Checklist

The following 10 integration and edge cases must be strictly verified before project delivery:

| # | Test Scenario | Expected Result | Pass Criteria |
|---|---|---|---|
| **T-01** | **8:30 PM Online Cutoff & Reception Walk-in** | At 8:30 PM, `/join` disables submission with explanatory banner; `/reception` `[ + Add Walk-in ]` modal remains fully operational. | Online form disabled; Walk-in form generates valid token. |
| **T-02** | **Duplicate Phone Validation** | Entering an existing active customer's phone number on `/join` rejects token creation and offers redirect to their `/status/:id`. | Prevents duplicate queue entry; cleanly routes to existing status. |
| **T-03** | **Specific Barber Assignment Isolation** | A customer who selected "Amit" is never assigned to "Ravi", even when Ravi clicks `[ Call next ]` repeatedly with no other customers waiting. | Ravi's `[ Call next ]` ignores Amit's request; token remains waiting for Amit. |
| **T-04** | **'Any Barber' FIFO Matching** | A customer selecting "Any barber" is assigned to whichever active barber clicks `[ Call next ]` first. | Token correctly transitions to `Called` with the calling barber's ID. |
| **T-05** | **Real-Time Cross-Device Sync (< 5s)** | Changing status or adding customer on Reception updates Customer Phone, Barber View, and TV Display within 5 seconds without page reload. | Zero reload needed; real-time broadcast arrives in $< 2$ seconds. |
| **T-06** | **TV Chime & Visual Notification** | When a customer status transitions to `Called`, the TV display flashes a gold highlight and plays a Web Audio API synthesized chime. | Visual flash visible; Web Audio chime plays cleanly. |
| **T-07** | **Staff PIN Security Gate** | Navigating to `/reception`, `/barber/:name`, or `/admin` prompts for 4-digit PIN (`1234`); persists in `sessionStorage` across page reloads. | Direct access blocked without PIN; reload retains authenticated state. |
| **T-08** | **Strict One-Way Status Progression** | Tokens progress `Waiting` $\rightarrow$ `Called` $\rightarrow$ `In chair` $\rightarrow$ `Done`; no reverse transitions or invalid state hops allowed. | State transitions follow monotonic DAG rules. |
| **T-09** | **Zero Active Barbers Wait Calculation** | When all on-duty barbers toggle status to `On break`, the wait calculation updates from numbers to `"Paused — all barbers on break"`. | No divide-by-zero or `NaN`; clear pause message displayed on all screens. |
| **T-10** | **Bilingual Toggle & 44px Tap Target Audit** | Switching to Gujarati (`GU`) displays 100% translated text without clipped glyphs or broken layouts; all mobile interactive elements measure $\ge 44\text{px}$. | Zero English leak; zero layout overflow; touch targets meet iOS/Android HIG. |
