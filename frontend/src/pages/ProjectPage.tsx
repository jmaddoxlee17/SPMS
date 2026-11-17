import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  FolderPlus,
  Layers3,
  Plus,
  Save,
  X,
} from "lucide-react";

import {
  getProjects,
  createProject,
  type Project,
} from "../services/projectService";

import "./ProjectPage.css";

const statusLabels: Record<Project["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export default function ProjectPage() {
  const navigate = useNavigate();

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create project form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();

      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Project statistics
  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((project) => project.status === "active").length,
      completed: projects.filter((project) => project.status === "completed")
        .length,
    };
  }, [projects]);

  // Open or close create form
  const toggleCreateForm = () => {
    setShowForm((previous) => !previous);
    setError("");
    setSuccess("");
  };

  // Create a new project
  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createProject(name.trim(), description.trim());

      setName("");
      setDescription("");
      setShowForm(false);

      await loadProjects();

      setSuccess("Project created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Navigate to project details
  const handleOpenProject = (projectId: string) => {
    navigate(`/projects/${projectId}/details`);
  };

  return (
    <div className="spms-projects-page">
      {/* Page Header */}
      <header className="spms-projects-header">
        <div>
          <div className="spms-projects-eyebrow">
            <FolderKanban size={15} />
            PROJECT WORKSPACE
          </div>

          <h1>Projects</h1>

          <p>
            Manage your software development projects, organize your team, and
            monitor progress.
          </p>
        </div>

        <button
          type="button"
          className="spms-projects-primary-button"
          onClick={toggleCreateForm}
        >
          {showForm ? (
            <>
              <X size={17} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={17} />
              New Project
            </>
          )}
        </button>
      </header>

      {/* Feedback Messages */}
      {error && (
        <div className="spms-projects-alert" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="spms-projects-success" role="status">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Project Summary */}
      <div className="spms-projects-stats">
        <div className="spms-projects-stat-card">
          <div className="spms-projects-stat-icon blue">
            <Layers3 size={21} />
          </div>

          <strong>{projectStats.total}</strong>
          <span>Total Projects</span>
        </div>

        <div className="spms-projects-stat-card">
          <div className="spms-projects-stat-icon purple">
            <FolderKanban size={21} />
          </div>

          <strong>{projectStats.active}</strong>
          <span>Active Projects</span>
        </div>

        <div className="spms-projects-stat-card">
          <div className="spms-projects-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <strong>{projectStats.completed}</strong>
          <span>Completed Projects</span>
        </div>
      </div>

      {/* Create Project Form */}
      {showForm && (
        <section className="spms-projects-form-card">
          <div className="spms-projects-form-heading">
            <div className="spms-projects-form-icon">
              <FolderPlus size={21} />
            </div>

            <div>
              <h2>Create New Project</h2>
              <p>Add a project to your workspace.</p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="spms-projects-field">
              <label htmlFor="new-project-name">
                Project Name
                <span className="spms-projects-required">*</span>
              </label>

              <input
                id="new-project-name"
                type="text"
                placeholder="Enter project name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
              />
            </div>

            <div className="spms-projects-field">
              <label htmlFor="new-project-description">Description</label>

              <textarea
                id="new-project-description"
                placeholder="Describe the project's purpose and goals..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </div>

            <div className="spms-projects-form-actions">
              <button
                className="spms-projects-primary-button"
                type="submit"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Creating..." : "Create Project"}
              </button>

              <button
                className="spms-projects-secondary-button"
                type="button"
                onClick={toggleCreateForm}
                disabled={saving}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Project List Header */}
      <section className="spms-projects-section">
        <div className="spms-projects-section-header">
          <div>
            <h2>All Projects</h2>

            <p>
              {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
              in your workspace
            </p>
          </div>

          <span className="spms-projects-count">{projects.length} Total</span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="spms-projects-empty">
            <FolderKanban size={32} />

            <h3>Loading projects...</h3>
            <p>Retrieving your projects from the database.</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="spms-projects-empty">
            <div className="spms-projects-empty-icon">
              <FolderPlus size={30} />
            </div>

            <h3>No projects yet</h3>

            <p>
              Create your first project to start organizing work and
              collaborating with your team.
            </p>

            <button
              type="button"
              className="spms-projects-primary-button"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Create Your First Project
            </button>
          </div>
        ) : (
          /* Project Cards */
          <div className="spms-projects-grid">
            {projects.map((project) => (
              <article className="spms-project-card" key={project.id}>
                <div className="spms-project-card-top">
                  <div className="spms-project-card-icon">
                    <FolderKanban size={22} />
                  </div>

                  <span
                    className={`spms-project-status status-${project.status}`}
                  >
                    <span className="spms-project-status-dot" />
                    {statusLabels[project.status]}
                  </span>
                </div>

                <div className="spms-project-card-content">
                  <h3 title={project.name}>{project.name}</h3>

                  <p>{project.description || "No description provided."}</p>
                </div>

                <div className="spms-project-card-meta">
                  <CalendarDays size={15} />

                  <span>
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="spms-project-card-footer">
                  <span className="spms-project-card-label">
                    Project Workspace
                  </span>

                  {/* Preserve Open Project navigation */}
                  <button
                    type="button"
                    className="project-open-button"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    Open Project
                    <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
