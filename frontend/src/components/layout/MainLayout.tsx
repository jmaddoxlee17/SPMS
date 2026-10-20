import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import "../../App.css";

interface MainLayoutProps {
  children?: ReactNode;
  pageTitle?: string;
}

export default function MainLayout({
  children,
  pageTitle = "Overview",
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((open) => !open);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`sidebar-container ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <Sidebar activePage={pageTitle} onNavigate={closeSidebar} />
      </aside>

      <div className="main-column">
        <TopNav
          pageTitle={pageTitle}
          onMenuClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="main-content">
          {children ?? (
            <div className="empty-workspace">
              <h2>Your workspace</h2>
              <p>Your project management workspace will appear here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
