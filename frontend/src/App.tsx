import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectRequirementsPage from "./pages/ProjectRequirementsPage";
import RisksPage from "./pages/RisksPage";
import EffortTrackingPage from "./pages/EffortTrackingPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* All protected SPMS routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <MainLayout pageTitle="Dashboard">
              <DashboardPage />
            </MainLayout>
          }
        />

        {/* Projects */}
        <Route
          path="/projects"
          element={
            <MainLayout pageTitle="Projects">
              <ProjectsPage />
            </MainLayout>
          }
        />

        {/* Project Details */}
        <Route
          path="/projects/:projectId/details"
          element={
            <MainLayout pageTitle="Project Details">
              <ProjectDetailsPage />
            </MainLayout>
          }
        />

        {/* Requirements Management */}
        <Route
          path="/projects/:projectId/requirements"
          element={
            <MainLayout pageTitle="Requirements">
              <ProjectRequirementsPage />
            </MainLayout>
          }
        />

        {/* Risk Management */}
        <Route
          path="/projects/:projectId/risks"
          element={
            <MainLayout pageTitle="Risks">
              <RisksPage />
            </MainLayout>
          }
        />

        {/* Effort Tracking */}
        <Route
          path="/projects/:projectId/effort"
          element={
            <MainLayout pageTitle="Effort Tracking">
              <EffortTrackingPage />
            </MainLayout>
          }
        />

        {/* Reports */}
        <Route
          path="/projects/:projectId/reports"
          element={
            <MainLayout pageTitle="Reports">
              <ReportsPage />
            </MainLayout>
          }
        />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
