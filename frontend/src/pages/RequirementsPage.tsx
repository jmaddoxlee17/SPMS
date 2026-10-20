import { ClipboardList } from "lucide-react";

export default function RequirementsPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <ClipboardList size={22} />
        </div>
        <div>
          <h1>Requirements</h1>
          <p>Manage functional and non-functional project requirements.</p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Requirements workspace</h2>
        <p>Your functional and non-functional requirements will appear here.</p>
      </div>
    </section>
  );
}
