import { ChartNoAxesCombined } from "lucide-react";

export default function ReportsPage() {
  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div className="workspace-page-icon">
          <ChartNoAxesCombined size={22} />
        </div>
        <div>
          <h1>Reports</h1>
          <p>Review project progress and performance summaries.</p>
        </div>
      </div>

      <div className="workspace-placeholder">
        <h2>Reports workspace</h2>
        <p>Project reports and progress summaries will appear here.</p>
      </div>
    </section>
  );
}
