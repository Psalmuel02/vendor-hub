# Vendor City — Design Document

**Style:** Clean, simple shadcn/ui defaults — no heavy custom theming. Function over flash.

---

## 1. Design Principles
- Use shadcn components as-is wherever possible (Card, Table, Badge, Tabs, Dialog, Sheet, Form, Select, Progress, Avatar, DropdownMenu).
- Neutral base theme (slate/zinc) with a single accent color for primary actions and status.
- Status communicated through **Badge color**, not icons-only — keep it scannable.
- Sidebar layout for Admin/Approver (data-dense), simpler top-nav layout for Vendor (lighter, self-service feel).
- No dashboards-for-dashboards-sake — every widget should answer "what needs my attention" or "where do things stand."

---

## 2. Layout Structure

### Admin / Approver Layout

Use shadcn `Sidebar` (or a simple fixed flex sidebar) + `Breadcrumb` in the topbar for nested pages (e.g., Vendors / Acme Co. / Documents).

### Vendor Layout
Simpler top-nav: Logo — Dashboard / My Documents / My Checklist / My Performance — Avatar menu. No sidebar; vendors have a narrower surface area.

---

## 3. Status & Badge Color Mapping

| Status | Badge variant |
|---|---|
| ACTIVE / APPROVED | green (success) |
| PENDING / PENDING_REVIEW | yellow (warning/outline) |
| REJECTED / SUSPENDED | red (destructive) |
| EXPIRING_SOON | orange/amber outline |
| EXPIRED | red (destructive), filled |

Keep it to shadcn's default `Badge` variants (`default`, `secondary`, `destructive`, `outline`) extended with a couple of custom Tailwind color classes for warning/amber states.

---

## 4. Key Pages — Component Breakdown

### Dashboard (role-aware)
- 3–4 `Card` stat tiles across the top (e.g., Total Vendors, Pending Approvals, Avg Compliance Score, Documents Expiring Soon).
- Below: two-column grid — left a `Table` of "Recent Approvals Needed", right a `Card` with a Recharts bar/line chart (compliance trend or performance trend).
- Vendor dashboard: same stat-tile pattern but scoped to self — "My Compliance Score" (with `Progress` bar), "My Documents" mini-list, "Latest Performance Score".

### Vendor Directory (`/vendors`)
- Top bar: `Input` (search) + `Select` filters (status, category) + "Add Vendor" `Button` (Admin only).
- `Table` with columns: Company, Category, Status (Badge), Compliance Score (Progress mini-bar), Performance Score, Last Updated.
- Row click → vendor detail page.

### Vendor Detail (`/vendors/[id]`)
- Header `Card`: company name, category, status badge, key contact, "Suspend/Activate" action (Admin).
- `Tabs`: Overview | Documents | Checklist | Performance | History.
  - **Overview**: summary cards (compliance %, performance %, open approvals).
  - **Documents**: `Table` of documents with status badges, expiry date, "Review" button opening a `Dialog` (approve/reject + comment textarea).
  - **Checklist**: list of checklist items as a form (Vendor fills) or scored list (Approver view) — each item in an `Accordion` or simple list row with `RadioGroup`/score input.
  - **Performance**: `Table` of past reviews + Recharts line chart of overall score over time.
  - **History**: audit-log style timeline (use a simple vertical list with timestamps, not over-engineered).

### Onboarding Wizard (`/onboarding`)
- Multi-step form using shadcn `Form` + a simple step indicator (e.g., numbered `Tabs` or custom stepper with 3 dots).
- Step 1: Company info. Step 2: Category selection. Step 3: Required document uploads (per category). Final: "Submit for Review" → status PENDING.

### Approvals Queue (`/approvals`)
- `Tabs`: All | Onboarding | Documents | Checklists.
- `Table`: Vendor, Type, Submitted date, "Review" button → `Sheet` (slide-over) with details + Approve/Reject buttons + comment field.
- Bulk-select optional for Phase 2, not MVP.

### Checklist Builder (`/compliance/checklists`) — Admin
- `Card` per template with editable item list.
- Add item: `Input` (label) + `Input` (weight, number) + add button — rendered as a simple repeating row list, not a complex drag-and-drop builder (keep it simple per requirement).

### KPI Manager (`/performance/kpis`) — Admin
- Same pattern as checklist builder: simple table/list of KPI name + weight, add/edit/delete inline.

### Performance Review Form (`/performance/reviews/new`)
- `Select` vendor + period `Input`.
- One row per KPI with a `Select` or numeric `Input` for score (1–5 or 0–100), weight shown as muted text.
- Auto-calculated "Overall Score" shown live at the bottom before submit.

### Reports (`/reports`)
- Grid of `Card`s with Recharts: vendor status breakdown (pie), compliance score distribution (bar), performance trend (line), documents expiring (table card).

---

## 5. Typography & Color
- Font: default shadcn stack (Inter or system font) — no custom fonts needed.
- Base: `zinc` or `slate` shadcn theme.
- One accent color for primary buttons/links — suggest a deep blue or teal to read as "enterprise tool," not flashy.
- Avoid gradients, heavy shadows, or decorative illustration — this is an internal ops tool, clarity > visual flair.

---

## 6. Notes for Build Order
1. Set up shadcn base theme + layout shells (Admin/Approver sidebar, Vendor topbar).
2. Build Vendor Directory + Vendor Detail (Overview tab only) first — this is the spine of the app.
3. Add Documents tab + approval Dialog.
4. Add Checklist (template builder + fill + score).
5. Add Performance (KPI manager + review form + history chart).
6. Add unified Approvals queue last — it pulls from documents + checklists + onboarding, so build those first.
7. Dashboard + Reports come last since they aggregate everything above.
