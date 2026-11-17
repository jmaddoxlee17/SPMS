import {
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardList,
  Clock,
  FolderKanban,
  LayoutDashboard,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { NavLink, useParams } from "react-router-dom";

import "./Sidebar.css";

interface SidebarProps {
  activePage?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const projectLinks = projectId
    ? [
        {
          label: "Project Details",
          path: `/projects/${projectId}/details`,
          icon: FolderKanban,
        },
        {
          label: "Requirements",
          path: `/projects/${projectId}/requirements`,
          icon: ClipboardList,
        },
        {
          label: "Risks",
          path: `/projects/${projectId}/risks`,
          icon: ShieldAlert,
        },
        {
          label: "Effort Tracking",
          path: `/projects/${projectId}/effort`,
          icon: Clock,
        },
        {
          label: "Reports",
          path: `/projects/${projectId}/reports`,
          icon: ChartNoAxesCombined,
        },
      ]
    : [];

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-nav-item${isActive ? " active" : ""}`;

  const getProjectNavClass = ({ isActive }: { isActive: boolean }) =>
    `project-sidebar-link${isActive ? " active" : ""}`;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Layers size={20} />
        </div>
        <span>SPMS</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="sidebar-nav-group">
          <span className="sidebar-nav-label">WORKSPACE</span>

          <NavLink
            to="/dashboard"
            onClick={onNavigate}
            end
            className={getNavClass}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            onClick={onNavigate}
            end
            className={getNavClass}
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </NavLink>
        </div>

        {/* Current Project */}
        {projectId && (
          <div className="project-sidebar-section">
            <div className="project-sidebar-heading">
              <span>CURRENT PROJECT</span>
              <ChevronRight size={14} />
            </div>

            <div className="project-sidebar-links">
              {projectLinks.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={label}
                  to={path}
                  onClick={onNavigate}
                  end
                  className={getProjectNavClass}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
