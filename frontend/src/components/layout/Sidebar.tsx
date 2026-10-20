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

interface SidebarProps {
  activePage?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const projectLinks = [
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
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Layers size={22} />
        </div>
        <span>SPMS</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          end
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? " active" : ""}`
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          onClick={onNavigate}
          end
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? " active" : ""}`
          }
        >
          <FolderKanban size={19} />
          <span>Projects</span>
        </NavLink>

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
                  className={({ isActive }) =>
                    `project-sidebar-link${isActive ? " active" : ""}`
                  }
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
