# SPMS Backend (Express + Supabase)

The backend for the Software Project Management System (SPMS), developed for SWE 4663 – Software Project Management at Kennesaw State University.

The backend uses Node.js, Express, and TypeScript to provide REST APIs for project management, team members, requirements, risks, effort tracking, and project reports.

Supabase provides PostgreSQL database storage, user authentication, and Row Level Security (RLS).

## Technology Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Database Security:** Supabase Row Level Security (RLS)
- **Hosting:** Vercel
- **Source Control:** GitHub

## Local Setup

### Prerequisites

- Node.js and npm
- Access to the SPMS Supabase project
- Required environment configuration

### 1. Install Dependencies

From the repository root:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

If `.env.example` exists, copy it:

```bash
cp .env.example .env
```

Configure the following values, using the variable names expected by your backend source code:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=http://localhost:5173
PORT=3001
```

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Public Supabase anon key.
- `FRONTEND_URL`: Allowed frontend origin for CORS.
- `PORT`: Port used by the local Express server.

Do not commit `.env` files or private credentials to GitHub.

The application uses the public Supabase key and authenticated user sessions with RLS. A service-role key is not required for the documented user-scoped API operations.

### 3. Database Setup

SPMS uses a PostgreSQL database hosted through Supabase.

Database tables include:

- `profiles`
- `projects`
- `project_members`
- `requirements`
- `project_risks`
- `effort_entries`

If setting up a new Supabase project, review the SQL migration files in the `supabase/migrations/` directory before applying them through the Supabase SQL Editor.

Do not rerun initial schema migrations against an existing populated database without reviewing possible conflicts.

### 4. Start the Backend

```bash
npm run dev
```

The local backend runs at:

http://localhost:3001

The development server reloads when backend source files change.

## Authentication and Authorization

SPMS uses Supabase Authentication for user sign-in and session management.

Protected API endpoints require a valid Supabase access token:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The Express authentication middleware validates the token and identifies the authenticated user.

Database operations are performed with the user's authentication context so Supabase Row Level Security policies enforce access permissions.

User passwords are handled by Supabase Authentication and are not sent to Express API endpoints.

Project permissions are based on project membership and assigned roles.

## API Endpoints

All API endpoints use the `/api` prefix.

### Authentication and User Information

| Method | Endpoint             | Description                         |
| ------ | -------------------- | ----------------------------------- |
| GET    | `/api/auth/validate` | Validate the authenticated session  |
| GET    | `/api/me`            | Retrieve the authenticated user     |
| GET    | `/api/users`         | Retrieve available user information |

### Projects

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| GET    | `/api/projects`            | List accessible projects   |
| POST   | `/api/projects`            | Create a project           |
| GET    | `/api/projects/:projectId` | Get project details        |
| PATCH  | `/api/projects/:projectId` | Update project information |
| DELETE | `/api/projects/:projectId` | Delete a project           |

### Project Members

| Method | Endpoint                                     | Description                       |
| ------ | -------------------------------------------- | --------------------------------- |
| GET    | `/api/projects/:projectId/members`           | List project members              |
| POST   | `/api/projects/:projectId/members`           | Add a team member                 |
| PATCH  | `/api/projects/:projectId/members/:memberId` | Update member information or role |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove a team member              |

### Requirements

| Method | Endpoint                                        | Description               |
| ------ | ----------------------------------------------- | ------------------------- |
| GET    | `/api/projects/:projectId/requirements`         | List project requirements |
| POST   | `/api/projects/:projectId/requirements`         | Add a requirement         |
| PATCH  | `/api/projects/:projectId/requirements/:itemId` | Update a requirement      |
| DELETE | `/api/projects/:projectId/requirements/:itemId` | Delete a requirement      |

### Project Risks

| Method | Endpoint                                 | Description        |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/api/projects/:projectId/risks`         | List project risks |
| POST   | `/api/projects/:projectId/risks`         | Create a risk      |
| PATCH  | `/api/projects/:projectId/risks/:itemId` | Update a risk      |
| DELETE | `/api/projects/:projectId/risks/:itemId` | Delete a risk      |

### Effort Tracking

| Method | Endpoint                                  | Description                     |
| ------ | ----------------------------------------- | ------------------------------- |
| GET    | `/api/projects/:projectId/effort`         | List recorded effort            |
| POST   | `/api/projects/:projectId/effort`         | Record person-hours             |
| PATCH  | `/api/projects/:projectId/effort/:itemId` | Update an effort entry          |
| DELETE | `/api/projects/:projectId/effort/:itemId` | Delete an effort entry          |
| GET    | `/api/projects/:projectId/effort/summary` | Retrieve summarized effort data |

The application tracks effort across five categories:

1. Requirements Analysis
2. Design
3. Coding
4. Testing
5. Project Management

Effort entries may optionally reference individual requirements to support hours-by-requirement reporting.

### Project Reports

The backend also provides project reporting functionality through the project reports API.

Reports aggregate project metrics such as:

- Requirement completion and status distribution
- Risk status distribution
- Total recorded person-hours
- Hours by development phase
- Hours by project member
- Hours by requirement

## Testing the Backend

### Local API Test

With the backend running locally, test an available public health endpoint:

```bash
curl -i http://localhost:3001/api/health
```

If authentication is required, an unauthenticated request to a protected endpoint should return HTTP 401:

```bash
curl -i http://localhost:3001/api/projects
```

### Authenticated Request

After signing in through the frontend, a valid Supabase access token can be used to test protected endpoints:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3001/api/projects
```

Replace `YOUR_ACCESS_TOKEN` with a valid session access token.

## Vercel Deployment

The SPMS frontend and backend are deployed separately on Vercel from the same GitHub repository.

**Production Frontend:**  
https://spms-frontend-alpha.vercel.app/

**Production Backend:**  
https://spms-backend.vercel.app/

### Backend Vercel Configuration

| Setting           | Configuration  |
| ----------------- | -------------- |
| Project           | `spms-backend` |
| Root Directory    | `backend`      |
| Framework         | Express        |
| Runtime           | Node.js        |
| Production Branch | `main`         |

The Express application entry point is `src/server.ts`.

### Backend Environment Variables

Configure the following variables in **Vercel → spms-backend → Settings → Environment Variables**:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=https://spms-frontend-alpha.vercel.app
```

Environment variables must match those referenced in the backend source code.

Do not add the `VITE_` prefix to backend-only environment variables.

### Frontend Configuration

The frontend requires its own environment variables, including the Supabase project URL, public key, and deployed backend API URL.

These are configured separately in the `spms-frontend` Vercel project.

The frontend uses the deployed Express API rather than `localhost:3001` in production.

### CORS Configuration

The backend must allow requests from the deployed frontend origin:

```text
https://spms-frontend-alpha.vercel.app
```

The frontend origin is configured using the `FRONTEND_URL` environment variable.

After updating deployment environment variables, redeploy the affected Vercel project.

## Additional Notes

- User accounts are created and authenticated through Supabase Auth.
- The application uses Supabase RLS policies for database access control.
- Project managers can manage projects and their associated members.
- Requirements, risks, and person-hours are associated with individual projects.
- The React frontend integrates with the Express REST API.
- Production environment variables are configured in Vercel and are not included in the GitHub repository.
- Local `.env` files are required only when running the backend outside the hosted deployment.

## Project Information

**Course:** SWE 4663 – Software Project Management  
**Institution:** Kennesaw State University  
**Team:** Team 7  
**Project:** Software Project Management System (SPMS)
