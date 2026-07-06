# Vendor City — Product Requirements Document (PRD)

**Version:** 1.0
**Owner:** Josh
**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL · shadcn/ui

---

## 1. Overview

Vendor City is a vendor management platform that helps organizations manage three core lifecycle areas for vendors:

1. **Compliance** — document/certificate submission with expiry tracking, plus checklist-based compliance scoring.
2. **Approval** — structured workflows for onboarding, document approval, and checklist sign-off.
3. **Performance** — KPI-based scoring across delivery, quality, cost, and communication.

The goal is a tool that feels like a real internal ops product — not a CRUD toy. It should have role-based dashboards, workflow states, audit trails, and basic analytics, while staying scoped enough to ship as a portfolio/capstone-grade build.

---

## 2. Goals

- Give **Admins** full visibility and control over vendors, templates, and users.
- Give **Approvers/Reviewers** a clear queue of pending work (documents, checklists, onboarding requests) with simple approve/reject actions and comments.
- Give **Vendors** self-service visibility into their compliance status, document expiry, and performance scores.
- Track everything with an **audit trail** — who approved/rejected what, and when.
- Surface **expiring documents** and **low compliance/performance scores** proactively.

### Non-goals (out of scope for v1)
- Payments/invoicing
- Multi-tenant / multi-organization support (single org instance)
- Email/SMS notification delivery (in-app notifications only for v1)
- Mobile app (responsive web only)

---

## 3. User Roles & Permissions

| Capability | Admin | Approver | Vendor |
|---|---|---|---|
| Manage users & roles | ✅ | ❌ | ❌ |
| Create/edit vendor categories | ✅ | ❌ | ❌ |
| Create checklist templates | ✅ | ❌ | ❌ |
| Create KPI templates | ✅ | ❌ | ❌ |
| Invite/onboard vendors | ✅ | ✅ (view) | ❌ |
| Upload compliance documents | ❌ | ❌ | ✅ |
| Approve/reject documents | ✅ | ✅ | ❌ |
| Fill compliance checklist | ❌ | ❌ | ✅ |
| Score compliance checklist | ✅ | ✅ | ❌ |
| Submit performance scores | ✅ | ✅ | ❌ |
| View own vendor profile | — | — | ✅ |
| View all vendors | ✅ | ✅ | ❌ |
| View reports/analytics | ✅ | ✅ (limited) | ❌ |

---

## 4. Core Modules

### 4.1 Vendor Management
- Vendor profile: company name, category, contact info, registration date, status (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`).
- Vendor onboarding flow: vendor self-registers → fills profile → uploads required documents → Admin/Approver reviews → approve/reject → status becomes `ACTIVE`.
- Vendor categories (e.g., Supplier, Contractor, Service Provider) — configurable by Admin, each category can require a different document checklist.

### 4.2 Compliance
- **Document tracking**: vendors upload required documents (e.g., CAC certificate, Tax Clearance, Insurance). Each document has a type, expiry date, and status (`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`).
- A background-computed flag marks documents `EXPIRING_SOON` (within 30 days) and `EXPIRED` (past expiry).
- **Checklist scoring**: Admin defines a checklist template (list of weighted items, e.g., "Has valid safety policy" = 10pts). Vendor responds (Yes/No/Attach evidence) → Approver scores each item → system computes overall compliance score (%).
- Vendor's **overall compliance status** = function of (all required docs approved + non-expired) + (checklist score ≥ threshold).

### 4.3 Approval Workflow
- Generic `ApprovalRequest` entity used for: vendor onboarding, document approval, checklist approval.
- States: `PENDING` → `APPROVED` / `REJECTED` (with required comment on rejection).
- Approver queue page groups pending items by type with quick-action approve/reject + comment modal.
- Every decision is logged to an **Audit Log** (who, what, when, previous state, new state, comment).

### 4.4 Performance (KPI-based)
- Admin defines KPI templates (e.g., Delivery Timeliness, Quality of Work, Cost Adherence, Communication) each with a weight.
- Approver/Admin submits a **Performance Review** per vendor per period (e.g., quarterly), scoring each KPI (1–5 or 0–100).
- System computes weighted overall performance score and stores historical reviews for trend charts.
- Vendor can view their own score history and breakdown (read-only).

### 4.5 Reporting / Analytics (Dashboard)
- Admin/Approver dashboard widgets:
  - Vendors by status (pie/bar)
  - Documents expiring in next 30 days (list)
  - Average compliance score across all vendors
  - Average performance score, trend over time
  - Pending approvals count
- Vendor dashboard widgets:
  - My compliance score + status
  - My documents (with expiry countdown)
  - My latest performance score + history chart

---

## 5. Data Model (Prisma sketch)

```prisma
enum Role {
  ADMIN
  APPROVER
  VENDOR
}

enum VendorStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
}

enum DocumentStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum ApprovalType {
  ONBOARDING
  DOCUMENT
  CHECKLIST
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  password      String
  role          Role
  vendor        Vendor?  // present only if role = VENDOR
  createdAt     DateTime @default(now())
}

model VendorCategory {
  id        String   @id @default(cuid())
  name      String   @unique
  vendors   Vendor[]
  checklistTemplates ChecklistTemplate[]
}

model Vendor {
  id            String       @id @default(cuid())
  userId        String       @unique
  user          User         @relation(fields: [userId], references: [id])
  companyName   String
  categoryId    String
  category      VendorCategory @relation(fields: [categoryId], references: [id])
  status        VendorStatus @default(PENDING)
  phone         String?
  address       String?
  complianceScore Float?     // computed/cached
  documents     ComplianceDocument[]
  checklistResponses ChecklistResponse[]
  performanceReviews PerformanceReview[]
  approvalRequests ApprovalRequest[]
  createdAt     DateTime     @default(now())
}

model ComplianceDocument {
  id          String         @id @default(cuid())
  vendorId    String
  vendor      Vendor         @relation(fields: [vendorId], references: [id])
  type        String         // e.g. "CAC Certificate"
  fileUrl     String
  expiryDate  DateTime?
  status      DocumentStatus @default(PENDING_REVIEW)
  reviewedById String?
  reviewedAt  DateTime?
  comment     String?
  createdAt   DateTime       @default(now())
}

model ChecklistTemplate {
  id          String   @id @default(cuid())
  name        String
  categoryId  String?
  category    VendorCategory? @relation(fields: [categoryId], references: [id])
  items       ChecklistItem[]
  createdAt   DateTime @default(now())
}

model ChecklistItem {
  id          String   @id @default(cuid())
  templateId  String
  template    ChecklistTemplate @relation(fields: [templateId], references: [id])
  label       String
  weight      Int      @default(1)
}

model ChecklistResponse {
  id          String   @id @default(cuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  templateId  String
  answers     Json     // [{itemId, answer, evidenceUrl, score}]
  totalScore  Float?
  scoredById  String?
  status      ApprovalStatus @default(PENDING)
  submittedAt DateTime @default(now())
}

model KpiTemplate {
  id      String @id @default(cuid())
  name    String // e.g. "Delivery Timeliness"
  weight  Int    @default(1)
}

model PerformanceReview {
  id          String   @id @default(cuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  period      String   // e.g. "2026-Q2"
  scores      Json     // [{kpiId, score}]
  overallScore Float
  reviewedById String
  comment     String?
  createdAt   DateTime @default(now())
}

model ApprovalRequest {
  id          String         @id @default(cuid())
  vendorId    String
  vendor      Vendor         @relation(fields: [vendorId], references: [id])
  type        ApprovalType
  refId       String         // id of document/checklist/onboarding
  status      ApprovalStatus @default(PENDING)
  decidedById String?
  comment     String?
  createdAt   DateTime       @default(now())
  decidedAt   DateTime?
}

model AuditLog {
  id          String   @id @default(cuid())
  actorId     String
  action      String   // e.g. "DOCUMENT_APPROVED"
  targetType  String   // "Vendor" | "ComplianceDocument" | etc.
  targetId    String
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

---

## 6. Pages / Routes

| Route | Role(s) | Purpose |
|---|---|---|
| `/login`, `/register` | All | Auth |
| `/onboarding` | Vendor | Multi-step: company info → documents → submit |
| `/dashboard` | All (role-aware view) | KPI widgets, alerts, quick links |
| `/vendors` | Admin, Approver | Vendor directory — table, filters (status, category, compliance score) |
| `/vendors/[id]` | Admin, Approver | Vendor detail — tabs: Overview / Documents / Checklist / Performance / History |
| `/vendors/[id]/edit` | Admin | Edit vendor profile/category/status |
| `/my-profile` | Vendor | Own profile + documents + checklist + performance (read-mostly) |
| `/compliance/documents` | Admin, Approver | All documents across vendors, filterable by status/expiry |
| `/compliance/checklists` | Admin | Manage checklist templates (CRUD items + weights) |
| `/compliance/checklists/[vendorId]` | Vendor, Approver | Vendor fills checklist / Approver scores it |
| `/performance/kpis` | Admin | Manage KPI templates |
| `/performance/reviews/new` | Admin, Approver | Submit a new performance review for a vendor |
| `/performance/reviews/[vendorId]` | All (scoped) | Review history + trend chart |
| `/approvals` | Admin, Approver | Unified queue: pending onboarding, documents, checklists |
| `/approvals/[id]` | Admin, Approver | Approval detail modal/page — approve/reject + comment |
| `/reports` | Admin | Analytics dashboard — charts, exportable summary |
| `/settings/users` | Admin | Manage users & roles |
| `/settings/categories` | Admin | Manage vendor categories |
| `/audit-log` | Admin | Full audit trail, filterable |

---

## 7. User Stories

### Admin
- As an Admin, I can create vendor categories so documents/checklists can be tailored per category.
- As an Admin, I can build a checklist template with weighted items so compliance can be scored consistently.
- As an Admin, I can build KPI templates so performance reviews are standardized.
- As an Admin, I can view all vendors with their compliance and performance status at a glance.
- As an Admin, I can see a report of expiring documents and low-scoring vendors.
- As an Admin, I can manage users and assign roles.

### Approver
- As an Approver, I have a queue of pending approvals (onboarding, documents, checklists) so I know what needs my attention.
- As an Approver, I can approve or reject a document with a comment.
- As an Approver, I can score a vendor's checklist responses.
- As an Approver, I can submit a performance review for a vendor each period.
- As an Approver, I can see a vendor's full history before making a decision.

### Vendor
- As a Vendor, I can register and complete an onboarding profile.
- As a Vendor, I can upload required compliance documents and see their review status.
- As a Vendor, I get a visual warning when a document is expiring soon.
- As a Vendor, I can fill out the compliance checklist assigned to my category.
- As a Vendor, I can view my performance score history and see what I'm being evaluated on.
- As a Vendor, I cannot edit anything once submitted for review (locked until decision is made).

---

## 8. Non-Functional Requirements
- Role-based access control enforced both client-side (UI) and server-side (API/route handlers).
- File uploads for documents (use a simple storage solution — e.g., local `/public/uploads` for dev, or a cloud bucket later).
- All state-changing actions (approve, reject, score) write to `AuditLog`.
- Computed scores (compliance %, performance %) should be derived server-side, not trusted from client input.
- Responsive UI (desktop-first, usable on tablet).

---

## 9. MVP Scope vs Phase 2

**MVP (build this first):**
- Auth + roles
- Vendor onboarding + profile
- Document upload + approve/reject
- Checklist template (single, not per-category) + fill + score
- Single KPI set + performance review submission + history
- Approvals queue (unified)
- Basic dashboard widgets

**Phase 2:**
- Per-category checklist templates
- Audit log UI
- Reports/analytics page with charts
- In-app notifications
- Document expiry auto-flagging job (cron)

---

## 10. Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Actions where useful)
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **UI:** shadcn/ui + Tailwind CSS
- **Auth:** NextAuth.js (credentials provider, role in session)
- **Charts:** Recharts (pairs well with shadcn)
- **Forms:** React Hook Form + Zod validation
