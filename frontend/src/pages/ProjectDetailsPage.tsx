import { FolderKanban } from "lucide-react";

export default function ProjectDetailsPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <FolderKanban size={22} />
        </div>
        <div>
          <h1>Project Details</h1>
          <p>
            View and manage project information, manager, and team memberss.
          </p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Project Details</h2>
        <p>Project information will appear here.</p>
      </div>
    </section>
  );
}
