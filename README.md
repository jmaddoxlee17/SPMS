# Software Project Management System (SPMS)

A team project for SWE 4663 – Software Project Management at Kennesaw State University.

## Project Overview

The Software Project Management System (SPMS) is a web application designed to help software development teams organize projects, manage requirements, track development effort, and monitor project progress.

The application provides a centralized workspace where project managers and team members can manage project information, record person-hours, identify project risks, and review project reports.

### Main Features

- **Project Management:** Create and manage projects, assign project managers, and track project status.
- **Team Management:** Add project members and manage their roles and permissions.
- **Requirements Management:** Create, update, and monitor functional and non-functional requirements.
- **Risk Management:** Record project risks, assess likelihood and impact, and document mitigation strategies.
- **Effort Tracking:** Record person-hours spent on requirements analysis, design, coding, testing, and project management.
- **Project Reports:** Review requirement progress, risks, and effort distribution across team members and development phases.
- **User Authentication:** Sign in and manage authenticated sessions using Supabase Authentication.

## Technology Stack

| Component         | Technology                        |
| ----------------- | --------------------------------- |
| Frontend          | React, TypeScript, Vite           |
| Backend           | Node.js, Express, TypeScript      |
| Database          | Supabase PostgreSQL               |
| Authentication    | Supabase Auth                     |
| Database Security | Supabase Row Level Security (RLS) |
| Hosting           | Vercel                            |
| Source Control    | GitHub                            |

## Live Application

**Frontend:** https://spms-frontend-alpha.vercel.app/

**Backend API:** https://spms-backend.vercel.app/

The frontend and backend are deployed as separate Vercel projects from the same GitHub repository.

## Repository Structure

```text
SPMS/
├── frontend/             # React and TypeScript application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Express API server
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- Access to the project's Supabase environment

### 1. Clone the Repository

```bash
git clone https://github.com/jmaddoxlee17/SPMS.git
cd SPMS
```

### 2. Configure the Frontend

Navigate to the frontend directory and install dependencies.

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/` and configure the required environment variables:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3001
```

Start the frontend development server:

```bash
npm run dev
```

The frontend typically runs at:

http://localhost:5173

### 3. Configure the Backend

Open another terminal and navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

http://localhost:3001

Environment variable names must match those used by the application source code.

Never commit environment files or private credentials to GitHub.

## Deployment

SPMS is hosted on Vercel using two separate projects:

**Frontend Deployment**

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

**Backend Deployment**

- Root directory: `backend`
- Framework: Express
- Runtime: Node.js

Both projects use environment variables configured through the Vercel dashboard.

Updates pushed to the configured production branch trigger automatic deployments.

## GitHub Collaboration Guidelines

**Do not make changes directly to the `main` branch.**

All team members must follow this workflow:

1. Pull the latest changes from `main`.
2. Create a separate branch for your feature, fix, or task.
3. Make and test your changes on that branch.
4. Commit your changes with a clear, descriptive message.
5. Push your branch to GitHub.
6. Open a pull request targeting `main`.
7. Request the project maintainer as the reviewer.
8. Address any feedback and make requested changes.
9. Wait for approval before merging.

Only the project maintainer should merge approved pull requests into `main`.

### Branch Naming Examples

- `feature/requirements-page`
- `feature/effort-tracking`
- `fix/login-validation`
- `docs/update-readme`

### Commit Message Examples

- `Add requirements management page`
- `Implement effort tracking form`
- `Fix project details validation`
- `Update project documentation`

## Project Documentation

Project plans, architecture diagrams, and other supporting documentation are maintained in the `docs/` directory when available.

## Team

SWE 4663 – Software Project Management  
Kennesaw State University

**Team 7**
