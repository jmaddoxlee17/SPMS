import { ChevronRight, Layers, X } from "lucide-react";
import { useParams } from "react-router-dom";

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
  const { projectId } = useParams<{ projectId: string }>();

  // Temporary fallback until project names are loaded from Supabase.
  const projectName = projectId
    ? projectId
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : null;

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X size={21} /> : <Layers size={21} />}
        </button>

        <div className="top-nav-page">
          <span className="top-nav-section">SPMS</span>

          <ChevronRight
            className="top-nav-breadcrumb-icon"
            size={15}
            aria-hidden="true"
          />

          {projectName && (
            <>
              <span className="top-nav-section top-nav-project">
                {projectName}
              </span>

              <ChevronRight
                className="top-nav-breadcrumb-icon"
                size={15}
                aria-hidden="true"
              />
            </>
          )}

          <h1 className="top-nav-title">{pageTitle}</h1>
        </div>
      </div>
    </header>
  );
}
