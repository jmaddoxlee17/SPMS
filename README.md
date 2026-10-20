
# Software Project Management System (SPMS)

A team project for SWE 4663 – Software Project Management at Kennesaw State University.

## Project Overview

SPMS is a web application designed to help teams manage project information, requirements, and development effort. The system will track time spent on requirements analysis, design, coding, testing, and project management.

## Technology Stack

- **Frontend:** React, TypeScript, and Vite
- **Backend and Database:** Supabase with PostgreSQL
- **Hosting:** Vercel
- **Source Control:** GitHub

## Getting Started

### Prerequisites

- Node.js and npm
- A GitHub account
- Access to the project's Supabase environment when it is configured

### Run the Frontend Locally

```bash
git clone <repository-url>
cd software-project-management-system
cd frontend
npm install
npm run dev
```

Replace `<repository-url>` with this repository's GitHub URL.

## GitHub Collaboration Guidelines

**Do not make changes directly to the `main` branch.**

All team members must follow this workflow:

1. Pull the latest changes from `main`.
2. Create a separate branch for your feature, fix, or task.
3. Make and test your changes on that branch.
4. Commit your changes with a clear, descriptive message.
5. Push your branch to GitHub.
6. Open a pull request targeting `main`.
7. Request Jason Maddox-Lee as the reviewer.
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

Project plans, architecture diagrams, and other supporting documentation will be maintained in the `docs/` directory as the project develops.

## Team

SWE 4663 – Software Project Management  
Kennesaw State University
