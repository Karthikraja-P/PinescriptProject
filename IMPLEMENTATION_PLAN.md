# PineScript Elite - Implementation Plan

## 1. Frontend Implementation (Next.js App Router)
**Goal:** Create a high-converting, premium dark-mode interface.

### Pages
- **Home (`/`)**: Landing page with services and CTA. (✅ Completed)
- **Start Project (`/start`)**: 
  - Multi-step enquiry wizard.
  - Steps: Contact Details -> Project Type (Strategy/Indicator) -> Description -> File Uploads.
- **Dashboard (`/dashboard`)**:
  - Client view of active projects.
  - Status Timeline.
  - One-click PayPal payment integration.
  - Source code download (secured).
- **Admin (`/admin`)**:
  - Kanban board for incoming requests.
  - Quoting interface (Set Price, Delivery Date).
  - Status management.

### Components
- **Navbar**: Glassmorphism, sticky. (✅ Completed)
- **Footer**: Legal links.
- **EnquiryForm**: Complex state form.
- **ProjectCard**: Summary for dashboard.
- **PaymentButton**: PayPal SDK wrapper.

---

## 2. Backend Implementation (Next.js API Routes + Server Actions)
**Goal:** Securely handle user data, payments, and project delivery.

### Database (PostgreSQL via Prisma)
- **User**: Authentication & Profile.
- **Project**: Stores enquiry details, price, status, payment state.
- **Payment**: Transaction logs.

### API Endpoints
- **`/api/projects`**: CRUD for project enquiries.
- **`/api/upload`**: Secure S3/R2 upload for specification documents.
- **`/api/payments/paypal/create`**: Initialize PayPal Order.
- **`/api/payments/paypal/capture`**: Verify transaction & unlock project.

---

## 3. Integrations
- **PayPal**: Client-side buttons + Server-side validation.
- **Email (Resend/SendGrid)**: 
  - Notify Admin of new enquiry.
  - Notify Client of Quote Ready.
  - Notify Client of Project Completion.

## 4. Work in Progress
- Project initialized at `/home/sri/pinescript_project` (accessed via workspace).
- Foundation (CSS, Layout, Home) established.
