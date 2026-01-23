# Backend Implementation Plan (DynamoDB Edition)

## 1. Database Architecture: AWS DynamoDB

We will use **AWS DynamoDB** with a **Single Table Design** pattern. This means ALL data (Users, Projects, Messages) will live in one table: **`PinescriptProjects`**.

### Table Schema
*   **Table Name**: `PinescriptProjects`
*   **Partition Key (PK)**: `String`
*   **Sort Key (SK)**: `String`
*   **GSI1 (Global Secondary Index)**:
    *   **GSI1PK**: `String`
    *   **GSI1SK**: `String`

### Data Models (how we map data)

#### 1. User Credentials
Stores user profile and authentication data.
*   **PK**: `USER#<email>`
*   **SK**: `PROFILE`
*   **Attributes**: `email`, `passwordHash`, `name`, `role` (ADMIN/CLIENT), `createdAt`

#### 2. Projects
Stores the main project requests.
*   **PK**: `USER#<email>`
*   **SK**: `PROJECT#<projectId>`
*   **GSI1PK**: `ADMIN#ALL_PROJECTS` (For Admin Dashboard)
*   **GSI1SK**: `TIMESTAMP#<createdAt>`
*   **Attributes**: `id`, `title`, `description`, `budget`, `status`, `createdAt`...



#### 3. Messages (Chat)
Stores communication for a specific project.
*   **PK**: `PROJECT#<projectId>`
*   **SK**: `MSG#<timestamp>`
*   **Attributes**: `sender` (email), `content`, `attachments`
*   **Status**: Implemented (Server Actions + DynamoDB)

#### 4. File Uploads
*   **Mechanism**: Base64 encoding stored in DynamoDB `MSG` items (Message Attachments).
*   **Limits**: 200KB per file (Client-side enforced).
*   **Status**: Implemented.

#### 5. Email Notifications
*   **Service**: AWS SES (via `@aws-sdk/client-ses`).
*   **Triggers**: Welcome, New Project, Quote Sent, Payment Received.
*   **Status**: Implemented.

## 2. Authentication
*   **NextAuth.js v5**:
*   **Strategy**: custom `CredentialsProvider` that queries the `USER#<email>` item from our `PinescriptProjects` table.
*   **Sessions**: JWT (Stateless). We won't store sessions in DB to save RCU/WCU, but we can if needed.

## 3. Server Actions & API
*   `db.ts`: `DynamoDBDocumentClient` instance.
*   **User Actions**: `registerUser`, `loginUser` (verify pwd).
*   **Project Actions**: `createProject`, `getDashboardProjects`.
*   **Admin Actions**: `getAllProjects`, `sendQuote`.

## 4. Immediate Implementation Steps
1.  **Dependencies**: Installed `@aws-sdk/*`.
2.  **Environment**: configured `.env`.
3.  **Database**: Table `PinescriptProjects` created.
4.  **Next Step**: Implement `src/lib/db-actions.ts` for User/Project CRUD.
5.  **Refactor**: Wire up "Start Project" form.


#### 6. Admin Reports
*   **Features**: Revenue calculation, Project stats (Active, Pending, Completed).
*   **Visualization**: Custom CSS Bar Charts.
*   **Status**: Implemented.
