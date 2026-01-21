# Backend Implementation Plan

## 1. Database Architecture
We will use **Prisma ORM** with **SQLite** for the initial local development. This ensures zero-configuration setup (no need to install a database server). It can be easily switched to PostgreSQL for production.

### Schema Design
**User**
*   `id`: String (UUID)
*   `email`: String (Unique)
*   `password`: String (Hashed)
*   `name`: String
*   `role`: Enum (ADMIN, CLIENT)

**Project**
*   `id`: String (UUID)
*   `userId`: String (Foreign Key)
*   `title`: String
*   `type`: String (Strategy/Indicator)
*   `description`: String
*   `budgetRange`: String
*   `status`: Enum (SUBMITTED, QUOTED, PAID, IN_PROGRESS, COMPLETED)
*   `createdAt`: DateTime

**Quote** (One-to-One with Project)
*   `id`: String
*   `projectId`: String
*   `amount`: Float
*   `currency`: String (USD)
*   `estimatedDays`: Int
*   `validUntil`: DateTime

## 2. Authentication
*   **NextAuth.js v5**: For secure session management.
*   **Credentials Provider**: Email/Password login.
*   **Protection**: Middleware to protect `/dashboard` (Clients) and `/admin` (Admins).

## 3. Server Actions (The Glue)
Instead of traditional API routes, we will use Next.js Server Actions for type-safe, direct backend calls.

*   `submitProjectRequest(data)`: Creates a project record linked to the current user.
*   `getDashboardProjects()`: Fetches projects for the logged-in user.
*   `getAdminProjects()`: Fetches all projects for the admin board.
*   `createQuote(projectId, amount, days)`: Admin action to send a quote.
*   `capturePayment(orderId)`: Handles PayPal success and updates project status.

## 4. Immediate Next Steps
1.  Install Prisma & Initialize SQLite.
2.  Define the `schema.prisma` file.
3.  Set up the database client.
4.  Refactor the "Start Project" form to submit to the database instead of LocalStorage.
