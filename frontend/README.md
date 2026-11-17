# SPMS Frontend (React + TypeScript + Vite)

The frontend for the Software Project Management System (SPMS), developed by Team 7 for SWE 4663 – Software Project Management at Kennesaw State University.

SPMS is a web application that allows project managers and team members to organize software projects, manage requirements, track development effort, identify project risks, and monitor project progress.

The frontend is built with React, TypeScript, and Vite. It communicates with the SPMS Express backend through REST APIs and uses Supabase Authentication for user sessions.

## Technology Stack

| Component            | Technology                     |
| -------------------- | ------------------------------ |
| Frontend Framework   | React                          |
| Programming Language | TypeScript                     |
| Build Tool           | Vite                           |
| Routing              | React Router                   |
| Authentication       | Supabase Auth                  |
| Backend Integration  | REST API (Node.js and Express) |
| Styling              | CSS                            |
| Icons                | Lucide React                   |
| Hosting              | Vercel                         |
| Source Control       | GitHub                         |

## Live Application

**Frontend:** https://spms-frontend-alpha.vercel.app/

**Backend API:** https://spms-backend.vercel.app/

The frontend and backend are deployed as separate Vercel projects from the same GitHub repository.

Users can access the deployed application directly through their browser without installing Node.js or configuring local environment files.

## Main Features

### User Authentication

- User registration and sign-in through Supabase Authentication.
- Authenticated sessions and protected application pages.
- Logout functionality.
- Authentication tokens included in protected backend API requests.

### Dashboard

- Overview of accessible projects.
- Summary information about project activity.
- Quick navigation to individual projects.

### Project Management

- Create and manage software projects.
- View project details and current status.
- Update project information.
- Navigate between project management sections.

### Team Management

- View members assigned to a project.
- Add or remove project members.
- Manage project membership and assigned roles.

### Requirements Management

- Create functional and non-functional requirements.
- Edit and delete requirements.
- Track requirement status and progress.

### Risk Management

- Record and maintain project risks.
- Assess risk likelihood and impact.
- Document mitigation strategies.
- Track risk status.

### Effort Tracking

- Record person-hours contributed by project members.
- Associate effort entries with requirements when applicable.
- Track development effort across five categories:
  - Requirements Analysis
  - Design
  - Coding
  - Testing
  - Project Management
- Review recorded hours and effort summaries.

### Project Reports

- Requirement completion statistics.
- Risk status summaries.
- Total project person-hours.
- Hours grouped by development phase.
- Hours grouped by project member.
- Hours associated with individual requirements.

## Project Structure

The frontend source code is organized into reusable components, application pages, services, and configuration files.

```text
frontend/
├── public/
├── src/
│   ├── components/       # Shared UI components
│   ├── layouts/          # Application layout
│   ├── pages/            # Application pages
│   ├── services/         # Backend API service functions
│   ├── lib/              # API and Supabase configuration
│   ├── App.tsx           # Application routes and structure
│   └── main.tsx          # React application entry point
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.app.json
└── vercel.json
```

## Local Development

### Prerequisites

- Node.js and npm
- Git
- Access to the SPMS Supabase project
- A running SPMS backend or access to its deployed API

### 1. Clone the Repository

```bash
git clone https://github.com/jmaddoxlee17/SPMS.git
cd SPMS/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file inside the `frontend` directory.

If a `.env.example` template exists, copy it:

```bash
cp .env.example .env.local
```

Configure the following environment variables:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3001
```

| Variable                 | Description                                 |
| ------------------------ | ------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL                        |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key used for authentication |
| `VITE_API_BASE_URL`      | Base URL of the Express backend             |

These example variable names must match the names referenced in `src/lib/supabase.ts` and `src/lib/api.ts`.

For local development, the API URL points to the locally running Express server.

The Supabase URL and public key are designed for browser use. Never place Supabase secret or service-role keys in variables prefixed with `VITE_`.

Do not commit `.env.local` or private credentials to GitHub.

### 4. Start the Frontend

```bash
npm run dev
```

The frontend normally runs at:

http://localhost:5173

Open this address in your browser to access the local application.

### 5. Start the Backend (When Developing Locally)

Open another terminal from the repository root:

```bash
cd backend
npm install
npm run dev
```

The backend normally runs at:

http://localhost:3001

The backend requires its own environment configuration, which is documented in `backend/README.md`.

Alternatively, the frontend can connect to the deployed backend by setting its API URL to the production backend address.

## Authentication and API Integration

SPMS uses Supabase Authentication to manage user accounts and sessions.

After a user signs in, the frontend obtains an access token from Supabase. Protected requests to the Express backend include the token in the authorization header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The backend validates authenticated requests and performs database operations according to the user's project permissions and Supabase Row Level Security policies.

The frontend does not directly handle user passwords for Express API authentication.

### Backend API

The application communicates with the SPMS backend to manage:

- Projects and project details
- Project members
- Requirements
- Project risks
- Effort entries
- Project reports

The frontend API configuration is maintained in `src/lib/api.ts`.

## Vercel Deployment

The frontend is deployed through Vercel using the GitHub repository.

### Deployment Configuration

| Setting           | Value           |
| ----------------- | --------------- |
| Vercel Project    | `spms-frontend` |
| Root Directory    | `frontend`      |
| Framework Preset  | Vite            |
| Build Command     | `npm run build` |
| Output Directory  | `dist`          |
| Production Branch | `main`          |

### Production Environment Variables

In Vercel, open:

**spms-frontend → Settings → Environment Variables**

Configure the frontend variables:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=https://spms-backend.vercel.app
```

The API base URL should not include `/api` if the frontend service functions already include `/api` in their request paths.

Vite environment variables prefixed with `VITE_` are included in the frontend build and can be accessed by browser JavaScript. Only public configuration values should use this prefix.

After changing environment variables, redeploy the frontend so the updated values are included in the build.

### React Router Configuration

SPMS uses React Router for client-side navigation.

Vercel must serve `index.html` when users refresh or directly visit application routes.

The `frontend/vercel.json` file can configure this behavior:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This allows routes such as `/dashboard` and `/projects` to load correctly when refreshed.

If frontend API requests are proxied through `/api`, the API rewrite must be placed before the React Router fallback.

### Automatic Deployment

Changes merged or pushed to the configured production branch trigger a new Vercel deployment.

The frontend build can also be tested locally before pushing:

```bash
npm run build
```

A successful build produces the production files in the `dist` directory.

## Troubleshooting

### Blank Page After Deployment

Verify that the required Supabase environment variables are configured in Vercel.

Check the browser developer console for JavaScript initialization errors.

### API Requests Point to Localhost

Check `VITE_API_BASE_URL` and ensure the production environment points to the deployed Express backend.

After updating the variable, redeploy the frontend.

### CORS Errors

Verify that the Express backend allows requests from:

https://spms-frontend-alpha.vercel.app

The backend CORS configuration must include this origin.

### 404 When Refreshing a Page

Verify that `vercel.json` contains the React Router fallback rewrite and is included in the deployed frontend project.

### Authentication or API Errors

Check the browser developer tools under the Network tab.

Confirm that:

- The frontend is using the correct backend URL.
- Supabase authentication succeeds.
- Protected requests include a valid access token.
- The backend API is deployed and responding.
- The user has permission to access the requested project.

## GitHub Collaboration

All development changes should follow the project's GitHub collaboration guidelines.

1. Pull the latest code from `main`.
2. Create a feature or bug-fix branch.
3. Make and test changes locally.
4. Commit changes with a descriptive message.
5. Push the branch to GitHub.
6. Open a pull request targeting `main`.
7. Request review from the project maintainer.
8. Merge approved changes.

The full collaboration guidelines are documented in the repository's root `README.md`.

## Additional Notes

- The frontend communicates with the Express backend through REST APIs.
- Supabase handles authentication and session management.
- Database access permissions are enforced through the backend and Supabase RLS.
- Local development requires environment configuration.
- Users accessing the deployed website do not need environment files.
- Production configuration is managed through Vercel.
- The frontend and backend are maintained in the same GitHub repository.

## Project Information

**Course:** SWE 4663 – Software Project Management  
**Institution:** Kennesaw State University  
**Team:** Team 7  
**Project:** Software Project Management System (SPMS)
