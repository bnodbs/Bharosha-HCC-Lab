# Bharosha Health Care Center Diagnostic Lab

## Purpose
This project is a modern, web-based Laboratory Information System (LIS) built specifically for Bharosha Health Care Center in Nepal. It is designed to manage patient registration, test orders, results entry, report generation, and more. This repository contains the Phase 1 implementation, which establishes the foundation and architecture for the application.

## Technology Stack
- Next.js (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Prisma ORM (Database access)
- PostgreSQL (Database)
- NextAuth/Auth.js (Authentication)

## Requirements
- Node.js >= 18
- PostgreSQL Database

## PostgreSQL Setup
1. Install PostgreSQL on your machine or use a hosted solution.
2. Create a new database for the application (e.g., \`bharosha_lab\`).
3. Note your connection credentials (username, password, host, port, database name).

## Environment Variables
Copy the \`.env.example\` file to \`.env\` and configure your database URL and NextAuth secret.

\`\`\`
cp .env.example .env
\`\`\`

Set your \`DATABASE_URL\` appropriately:
\`DATABASE_URL="postgresql://user:password@localhost:5432/bharosha_lab?schema=public"\`

## Prisma Setup
After configuring your \`.env\` file, apply the Prisma schema to your database:

\`\`\`
npx prisma db push
\`\`\`

Generate the Prisma client:
\`\`\`
npx prisma generate
\`\`\`

## Development Commands
Install dependencies:
\`\`\`
npm install
\`\`\`

Start the development server:
\`\`\`
npm run dev &
\`\`\`

Open http://localhost:3000 in your browser.

## Production Build Commands
Build the application for production:
\`\`\`
npm run build
\`\`\`

Start the production server:
\`\`\`
npm start &
\`\`\`

## How to create the first admin user
In Phase 1, there is no UI for initial user creation. You will need to create the first admin user directly in the database.

Using Prisma Studio (recommended):
\`\`\`
npx prisma studio
\`\`\`
1. Open Prisma Studio (usually http://localhost:5555).
2. Go to the \`User\` model.
3. Add a new record.
4. Set \`email\`, \`name\`, \`role\` (as 'ADMIN').
5. You must use a bcrypt hashed string for the \`password\` field.

Example hashed password for 'password123':
\`$2y$10$YourHashedPasswordStringHere\` (You can generate this using a Node script or online tool).

## How to run tests
**Current Limitation:** No automated test runner (like Jest or Playwright) is configured yet in this Phase 5 setup. Test infrastructure will be added in subsequent phases. Validation is currently performed via TypeScript compilation (`npm run build`) and Prisma schema validation.

## Features Implemented in Phase 1
- Initialized Next.js project with TypeScript and Tailwind CSS.
- Configured Prisma with a comprehensive schema for medical laboratory data.
- Setup NextAuth for credential-based authentication.
- Created foundational UI layouts for authentication and the main dashboard.

## Features Implemented in Phase 2
- **Patient Registration**: Added ability to register new patients.
- **Lab ID Generation**: Automatically generates a unique, immutable Lab ID for each patient in the format `LAB-YYYY-00000X`.
- **Patient Search & List**: View, paginate, and search patients by Lab ID, Name, or Phone using server-side rendering.
- **Patient Profiles**: Dedicated page to view patient details and history placeholders.
- **Edit Functionality**: Authorized roles (Admin, Lab Technician) can update patient demographic information securely.

## Features Implemented in Phase 3
- **Test Master Setup**: Structured test data model separating tests (Panels) and granular parameters.
- **Categorization**: Dynamically filters distinct categories automatically.
- **Parameter Formatting**: Supports textual, numeric, qualitative, and exact select types per parameter.
- **Data Seed**: Safe idempotent seed generator inserting defaults without duplications.
- **Full UI Integration**: Add, Edit, Filter capabilities securely built restricted to ADMIN access properly protecting core data limits.

## Features Implemented in Phase 4
- **Reference Range Management**: Comprehensive, Admin-managed reference ranges tied directly to Test Parameters.
- **Sex and Age Resolution**: Supports setting boundaries based on Sex (ALL, MALE, FEMALE) and strictly inclusive Age logic (Days, Months, Years).
- **Security Check**: Only users with the `ADMIN` role may manage reference limits; ensuring clinical laboratory safety.

## Features Implemented in Phase 5
- **Laboratory Order Workflow**: Implements the core clinical workflow: *Patient → Order → Tests → Parameters → Results*.
- **Atomic Order Creation**: Transactions strictly govern the generation of safe, sequential accession IDs (e.g., `ORD-2023-000001`).
- **Result Entry & Dynamic Flags**: Test parameter inputs render dynamically based on their `dataType`. Numeric inputs are cross-checked against applicable active reference ranges based on patient demographics.
- **Historical Reference Snapshots**: Captures a static text snapshot of the exact Reference Range and Flag (LOW, NORMAL, HIGH) at the time of entry, preventing data distortion if lab limits change in the future.
- **Role Permissions**: `ADMIN` and `LAB_TECHNICIAN` roles are authorized to create orders and update results. `VIEWER` is restricted to read-only access.
