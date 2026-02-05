# PineScript Elite Platform

A custom web application for managing Pine Script development requests, quotes, payments, and secure delivery. Connecting traders with expert Pine Script developers.

## 🚀 Features

### For Clients
- **Project Requests**: Easy-to-use wizard for submitting Strategy or Indicator requests with file attachments.
- **Dashboard**: Track project status (New, Quoted, In Progress, Completed).
- **Messaging**: Built-in chat to communicate with developers.
- **Payments**: Integrated PayPal payments to accept quotes securely.
- **Secure Delivery**: Direct download of completed source code from the dashboard.

### For Admins
- **Enquiry Management**: Review incoming requests and send custom quotes (Price, Deadline, Notes).
- **Project Tracking**: Monitor all active projects and payment statuses.
- **Delivery System**: Securely upload completed files to finalize projects.
- **RBAC Security**: Role-Based Access Control ensures only admins can perform sensitive actions.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: TypeScript
- **Database**: AWS DynamoDB (Single Table Design)
- **Authentication**: NextAuth.js (Credentials Provider)
- **Payments**: PayPal JavaScript SDK via `@paypal/react-paypal-js`
- **Email**: AWS SES (via `@aws-sdk/client-ses`)

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- AWS Account (for DynamoDB/SES) or configured Local Mock
- PayPal Developer Account (for Client ID)

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables in `.env`:
    ```env
    # AWS (or Mock)
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=dummy
    AWS_SECRET_ACCESS_KEY=dummy
    DYNAMODB_ENDPOINT=mock

    # PayPal
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=test

    # Auth
    NEXTAUTH_SECRET=your-secret
    NEXTAUTH_URL=http://localhost:3000
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🧪 Testing the Application

### 1. Register a Client
- Navigate to `http://localhost:3000/auth` -> **Register**
- create a new account (e.g., `client@test.com`)
- **Submit a Request**: Go to `/start` and submit a new project.

### 2. Admin Workflow
- **Create Admin**: Run the seeed script to create an admin account:
    ```bash
    npx tsx scripts/seed-data.ts
    ```
    *(Creates `admin@test.com` / `password`)*
- **Login as Admin**: Open a private window or logout user.
- **Send Quote**: Go to **Enquiries**, select the request, and click **Send Quote**.

### 3. Payment & Delivery
- **Accept Quote**: Log back in as Client -> Dashboard -> Click **Review** on the project -> **Pay** (Mock Mode will simulate success).
- **Deliver**: Log in as Admin -> **Active Projects** -> **Deliver**. Upload a `.pine` or `.txt` file.
- **Download**: Log in as Client -> Dashboard -> Click **Download**.

## 🛡 Security
- **RBAC**: Admin actions are strictly protected.
- **Mock Mode**: Payment and Email services default to "Mock" mode if invalid credentials are detected, preventing accidental charges or spam.
