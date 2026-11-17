import { useEffect, useState } from "react";
import { ChevronRight, Layers, X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import LogoutButton from "./LogoutButton";
import { getProjectById } from "../../services/projectService";

import "./TopNav.css";

interface TopNavProps {
  pageTitle: string;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export default function TopNav({
  pageTitle,
  onMenuClick,
  isSidebarOpen,
}: TopNavProps) {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProjectName = async () => {
      if (!projectId) {
        setProjectName(null);
        return;
      }

      setProjectName(null);

      try {
        const project = await getProjectById(projectId);

        if (active) {
          setProjectName(project.name);
        }
      } catch (error) {
        console.error("Failed to load project name:", error);

        if (active) {
          setProjectName("Project");
        }
      }
    };

    void loadProjectName();

    return () => {
      active = false;
    };
  }, [projectId]);

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        {/* Mobile sidebar control */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X size={20} /> : <Layers size={20} />}
        </button>

        {/* Breadcrumb */}
        <nav className="top-nav-page" aria-label="Breadcrumb">
          <button
            type="button"
            className="top-nav-section top-nav-link"
            onClick={() => navigate("/dashboard")}
          >
            SPMS
          </button>

          <ChevronRight
            className="top-nav-breadcrumb-icon"
            size={15}
            aria-hidden="true"
          />

          {projectId && (
            <>
              <button
                type="button"
                className="top-nav-section top-nav-link top-nav-project"
                onClick={() => navigate(`/projects/${projectId}/details`)}
                title={projectName || "Project"}
              >
                {projectName || "Loading project..."}
              </button>

              <ChevronRight
                className="top-nav-breadcrumb-icon"
                size={15}
                aria-hidden="true"
              />
            </>
          )}

          <span className="top-nav-title" aria-current="page">
            {pageTitle}
          </span>
        </nav>
      </div>

      {/* Account actions */}
      <div className="top-nav-right">
        <LogoutButton />
      </div>
    </header>
  );
}
