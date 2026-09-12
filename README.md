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
No automated tests are configured yet in this Phase 1 setup. Test infrastructure will be added in subsequent phases.

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
