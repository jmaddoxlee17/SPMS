import { useState, type ReactNode } from "react";

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
    setIsSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-container ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <Sidebar onNavigate={closeSidebar} />
      </aside>

      {/* Main workspace */}
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
