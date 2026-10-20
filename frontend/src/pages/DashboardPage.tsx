import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <LayoutDashboard size={22} />
        </div>
        <div>
          <h1>Dashboard</h1>
          <p>Get an overview of your workspace and project activity.</p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Welcome to SPMS</h2>
        <p>
          Your project overview, recent activity, and important updates will
          appear here.
        </p>
      </div>
    </section>
  );
}
