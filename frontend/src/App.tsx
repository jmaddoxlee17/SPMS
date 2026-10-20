import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

import DashboardPage from "./pages/DashboardPage";
import RequirementsPage from "./pages/RequirementsPage";
import RisksPage from "./pages/RisksPage";
import EffortTrackingPage from "./pages/EffortTrackingPage";
import ReportsPage from "./pages/ReportsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectsPage from "./pages/ProjectPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <MainLayout pageTitle="Dashboard">
            <DashboardPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects"
        element={
          <MainLayout pageTitle="Projects">
            <ProjectsPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects/:projectId/details"
        element={
          <MainLayout pageTitle="Project Details">
            <ProjectDetailsPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects/:projectId/requirements"
        element={
          <MainLayout pageTitle="Requirements">
            <RequirementsPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects/:projectId/risks"
        element={
          <MainLayout pageTitle="Risks">
            <RisksPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects/:projectId/effort"
        element={
          <MainLayout pageTitle="Effort Tracking">
            <EffortTrackingPage />
          </MainLayout>
        }
      />

      <Route
        path="/projects/:projectId/reports"
        element={
          <MainLayout pageTitle="Reports">
            <ReportsPage />
          </MainLayout>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
