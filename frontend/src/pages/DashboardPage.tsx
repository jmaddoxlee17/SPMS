import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";

import { getProjects, type Project } from "../services/projectService";

import "./DashboardPage.css";

const statusLabels: Record<Project["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "active").length,
      completed: projects.filter((project) => project.status === "completed")
        .length,
    }),
    [projects],
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [projects],
  );

  const openProject = (projectId: string) => {
    navigate(`/projects/${projectId}/details`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your projects and current work.</p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dashboard-button dashboard-button-secondary"
            onClick={() => void loadProjects(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="dashboard-button dashboard-button-primary"
            onClick={() => navigate("/projects")}
          >
            View All Projects
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-summary">
        <div className="dashboard-summary-item">
          <span>Total Projects</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="dashboard-summary-item">
          <span>Active Projects</span>
          <strong>{stats.active}</strong>
        </div>

        <div className="dashboard-summary-item">
          <span>Completed Projects</span>
          <strong>{stats.completed}</strong>
        </div>
      </section>

      <section className="dashboard-projects">
        <div className="dashboard-section-header">
          <div>
            <h2>Recent Projects</h2>
            <p>Your five most recently created projects.</p>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty">Loading projects...</div>
        ) : recentProjects.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No projects yet</h3>
            <p>
              Create a project to start organizing work and tracking progress.
            </p>

            <button
              type="button"
              className="dashboard-button dashboard-button-primary"
              onClick={() => navigate("/projects")}
            >
              Go to Projects
            </button>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="dashboard-project-name">
                        {project.name}
                      </div>

                      {project.description && (
                        <div className="dashboard-project-description">
                          {project.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className={`dashboard-status status-${project.status}`}
                      >
                        {statusLabels[project.status]}
                      </span>
                    </td>

                    <td className="dashboard-date">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="dashboard-open-button"
                        onClick={() => openProject(project.id)}
                      >
                        Open
                        <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
