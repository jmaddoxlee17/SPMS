import { Clock } from "lucide-react";

export default function EffortTrackingPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <Clock size={22} />
        </div>
        <div>
          <h1>Effort Tracking</h1>
          <p>Record daily or weekly person-hours across project work areas.</p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Effort Tracking workspace</h2>
        <p>Effort entries and total person-hours will appear here.</p>
      </div>
    </section>
  );
}
