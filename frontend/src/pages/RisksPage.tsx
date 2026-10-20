import { ShieldAlert } from "lucide-react";

export default function RisksPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1>Risks</h1>
          <p>Identify project risks and track their current status.</p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Risks workspace</h2>
        <p>Project risks and their statuses will appear here.</p>
      </div>
    </section>
  );
}
