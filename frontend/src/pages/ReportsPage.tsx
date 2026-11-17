import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Users,
  RefreshCw,
} from "lucide-react";

import {
  getProjectReport,
  type ProjectReport,
} from "../services/projectReportService";

import "./ReportsPage.css";

const phaseLabels: Record<string, string> = {
  requirement_analysis: "Requirement Analysis",
  design: "Design",
  coding: "Coding",
  testing: "Testing",
  project_management: "Project Management",
};

const formatHours = (hours: number): string => hours.toFixed(2);

const titleCase = (value: string): string =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(
    async (isRefresh = false) => {
      if (!projectId) {
        setError("Missing project ID.");
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setReport(null);
      }

      setError("");

      try {
        const data = await getProjectReport(projectId);
        setReport(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project reports.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const totalRequirements = report?.summary.total_requirements ?? 0;

  const totalRisks = report?.summary.total_risks ?? 0;

  const totalHours = report?.summary.total_hours ?? 0;

  const completionPercentage =
    report?.summary.requirement_completion_percentage ?? 0;

  const openRisks = report?.summary.open_risks ?? 0;

  const requirementsByStatus = report?.requirements_by_status ?? [];

  const risksByStatus = report?.risks_by_status ?? [];

  const hoursByPhase = (report?.hours_by_phase ?? []).map((item) => ({
    ...item,
    label: phaseLabels[item.category] ?? item.category,
  }));

  const hoursByMember = report?.hours_by_member ?? [];

  const hoursByRequirement = report?.hours_by_requirement ?? [];

  const generalHours = report?.general_hours ?? 0;

  return (
    <div className="spms-reports-page">
      <button
        type="button"
        className="spms-reports-back"
        onClick={() =>
          navigate(projectId ? `/projects/${projectId}/details` : "/projects")
        }
      >
        <ArrowLeft size={16} />
        Back to Project Details
      </button>

      <header className="spms-reports-heading">
        <div>
          <div className="spms-reports-eyebrow">
            <BarChart3 size={15} />
            PROJECT ANALYTICS
          </div>

          <h1>Project Reports</h1>

          <p>
            {report?.project.name
              ? `${report.project.name} — Project performance and progress overview.`
              : "Project performance and progress overview."}
          </p>
        </div>

        <button
          type="button"
          className="spms-btn spms-btn-secondary"
          onClick={() => void loadReports(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="spms-reports-alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="spms-reports-card spms-reports-empty">
          Loading project reports...
        </div>
      ) : !report ? (
        <div className="spms-reports-card spms-reports-empty">
          Report data is unavailable. Try refreshing.
        </div>
      ) : (
        <>
          <div className="spms-reports-stats">
            {[
              {
                label: "Requirements",
                value: String(totalRequirements),
                icon: ClipboardList,
                color: "blue",
              },
              {
                label: "Requirement Completion",
                value: `${completionPercentage}%`,
                icon: CheckCircle2,
                color: "green",
              },
              {
                label: "Person-Hours",
                value: formatHours(totalHours),
                icon: Clock3,
                color: "purple",
              },
              {
                label: "Open Risks",
                value: String(openRisks),
                icon: AlertTriangle,
                color: "orange",
              },
            ].map((stat) => (
              <div className="spms-reports-stat" key={stat.label}>
                <div className={`spms-reports-stat-icon ${stat.color}`}>
                  <stat.icon size={20} />
                </div>

                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="spms-reports-grid">
            <section className="spms-reports-card spms-reports-section">
              <h2>Requirement Progress</h2>

              <p className="spms-reports-subtitle">
                Requirements grouped by current status
              </p>

              {requirementsByStatus.map((item) => {
                const percentage =
                  totalRequirements > 0
                    ? (item.count / totalRequirements) * 100
                    : 0;

                return (
                  <div className="spms-reports-progress-item" key={item.status}>
                    <div className="spms-reports-progress-label">
                      <span>{titleCase(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>

                    <div className="spms-reports-progress-track">
                      <div
                        className="spms-reports-progress-fill blue"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="spms-reports-card spms-reports-section">
              <h2>Risk Overview</h2>

              <p className="spms-reports-subtitle">
                Risks grouped by resolution status
              </p>

              {risksByStatus.map((item) => {
                const percentage =
                  totalRisks > 0 ? (item.count / totalRisks) * 100 : 0;

                return (
                  <div className="spms-reports-progress-item" key={item.status}>
                    <div className="spms-reports-progress-label">
                      <span>{titleCase(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>

                    <div className="spms-reports-progress-track">
                      <div
                        className="spms-reports-progress-fill orange"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          <section className="spms-reports-card spms-reports-section">
            <h2>Hours by Development Phase</h2>

            <p className="spms-reports-subtitle">
              Aggregated person-hours across the five work categories
            </p>

            {hoursByPhase.map((item) => {
              const percentage =
                totalHours > 0 ? (item.hours / totalHours) * 100 : 0;

              return (
                <div className="spms-reports-progress-item" key={item.category}>
                  <div className="spms-reports-progress-label">
                    <span>{item.label}</span>
                    <strong>{formatHours(item.hours)} hrs</strong>
                  </div>

                  <div className="spms-reports-progress-track">
                    <div
                      className="spms-reports-progress-fill blue"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          <section className="spms-reports-card">
            <div className="spms-reports-section-heading">
              <Users size={19} />

              <div>
                <h2>Hours by Team Member</h2>
                <p>Recorded effort across the project team</p>
              </div>
            </div>

            <div className="spms-reports-table-wrapper">
              <table className="spms-reports-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Project Role</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {hoursByMember.map((member) => (
                    <tr key={member.user_id}>
                      <td className="spms-reports-member-name">
                        {member.display_name}
                      </td>

                      <td className="spms-reports-capitalize">
                        {titleCase(member.role)}
                      </td>

                      <td className="spms-reports-hours">
                        {formatHours(member.hours)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hoursByMember.length === 0 && (
              <div className="spms-reports-empty">No team members found.</div>
            )}
          </section>

          <section className="spms-reports-card">
            <div className="spms-reports-section-heading">
              <ClipboardList size={19} />

              <div>
                <h2>Hours by Requirement</h2>
                <p>Person-hours linked to individual project requirements</p>
              </div>
            </div>

            <div className="spms-reports-table-wrapper">
              <table className="spms-reports-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Person-Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {hoursByRequirement.map((item) => (
                    <tr key={item.requirement_id}>
                      <td>{item.title}</td>
                      <td className="spms-reports-hours">
                        {formatHours(item.hours)}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td>General Project Work</td>
                    <td className="spms-reports-hours">
                      {formatHours(generalHours)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
