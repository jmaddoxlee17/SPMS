import { ArrowRight, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
}

const projects: Project[] = [
  {
    id: "project-1",
    name: "Software Project Management System",
    description:
      "Manage project information, requirements, risks, and effort tracking.",
    manager: "Project Manager",
  },
];

export default function ProjectsPage() {
  const navigate = useNavigate();

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <FolderKanban size={22} />
        </div>
        <div>
          <h1>Projects</h1>
          <p>Select a project to access its workspace and tracking tools.</p>
        </div>
      </div>

      <div className="projects-page-content">
        <div className="projects-section-heading">
          <div>
            <h2>All Projects</h2>
            <p>{projects.length} project available</p>
          </div>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <div className="project-card-icon">
                  <FolderKanban size={22} />
                </div>
                <span className="project-card-label">Project</span>
              </div>

              <h3>{project.name}</h3>
              <p className="project-card-description">{project.description}</p>

              <div className="project-card-manager">
                <span>Project Manager</span>
                <strong>{project.manager}</strong>
              </div>

              <button
                type="button"
                className="project-open-button"
                onClick={() => navigate(`/projects/${project.id}/details`)}
              >
                Open Project
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
