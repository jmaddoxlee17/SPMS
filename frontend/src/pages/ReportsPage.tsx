import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getProjectById } from "../services/projectService";
import {
  getRequirements,
  type Requirement,
  type RequirementStatus,
} from "../services/requirementService";
import {
  getProjectRisks,
  type ProjectRisk,
  type RiskStatus,
} from "../services/projectRiskService";
import {
  getEffortEntries,
  type EffortEntry,
  type EffortCategory,
} from "../services/effortService";
import {
  getProjectMembers,
  type ProjectMember,
} from "../services/projectMemberService";

import "./ReportsPage.css";

const phaseLabels: Record<EffortCategory, string> = {
  requirement_analysis: "Requirement Analysis",
  design: "Design",
  coding: "Coding",
  testing: "Testing",
  project_management: "Project Management",
};

const requirementStatuses: RequirementStatus[] = [
  "proposed",
  "approved",
  "implemented",
  "verified",
  "rejected",
];

const riskStatuses: RiskStatus[] = [
  "identified",
  "mitigating",
  "resolved",
  "accepted",
];

const formatHours = (hours: number): string => hours.toFixed(2);

const titleCase = (value: string): string =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ProjectReport | null>(null);
  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [entries, setEntries] = useState<EffortEntry[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);

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

  // Overall person-hours
  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.hours), 0),
    [entries],
  );

  // Requirement completion: implemented or verified
  const completedRequirements = requirements.filter(
    (requirement) =>
      requirement.status === "implemented" || requirement.status === "verified",
  ).length;

  const completionPercentage =
    requirements.length > 0
      ? (completedRequirements / requirements.length) * 100
      : 0;

  // Risks not yet resolved or accepted
  const openRisks = risks.filter(
    (risk) => risk.status === "identified" || risk.status === "mitigating",
  ).length;

  // Requirement status summary
  const requirementsByStatus = requirementStatuses.map((status) => ({
    status,
    count: requirements.filter((requirement) => requirement.status === status)
      .length,
  }));

  // Risk status summary
  const risksByStatus = riskStatuses.map((status) => ({
    status,
    count: risks.filter((risk) => risk.status === status).length,
  }));

  // Development phase totals
  const hoursByPhase = Object.entries(phaseLabels).map(([category, label]) => ({
    category,
    label,
    hours: entries
      .filter((entry) => entry.category === category)
      .reduce((sum, entry) => sum + Number(entry.hours), 0),
  }));

  // Team member effort totals

  const hoursByMember = Array.from(
    new Set([
      ...members.map((member) => member.user_id),
      ...entries.map((entry) => entry.user_id),
    ]),
  )
    .map((userId) => {
      const member = members.find((item) => item.user_id === userId);

      const hours = entries
        .filter((entry) => entry.user_id === userId)
        .reduce((sum, entry) => sum + Number(entry.hours), 0);

      const emailName = (member?.email || "")
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim();

      return {
        userId,
        name:
          member?.profiles?.display_name?.trim() ||
          emailName ||
          "Former Team Member",
        role: member?.role || "former member",
        hours,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  // Requirement-specific effort
  const hoursByRequirement = requirements
    .map((requirement) => ({
      id: requirement.id,
      title: requirement.title,
      hours: entries
        .filter((entry) => entry.requirement_id === requirement.id)
        .reduce((sum, entry) => sum + Number(entry.hours), 0),
    }))
    .sort((a, b) => b.hours - a.hours);

  const generalHours = entries
    .filter((entry) => entry.requirement_id === null)
    .reduce((sum, entry) => sum + Number(entry.hours), 0);

  return (
    <div className="spms-reports-page">
      {/* Navigation */}
      <button
        className="spms-reports-back"
        onClick={() =>
          navigate(projectId ? `/projects/${projectId}/details` : "/projects")
        }
      >
        <ArrowLeft size={16} />
        Back to Project Details
      </button>

      {/* Heading */}
      <header className="spms-reports-heading">
        <div>
          <div className="spms-reports-eyebrow">
            <BarChart3 size={15} />
            PROJECT ANALYTICS
          </div>

          <h1>Project Reports</h1>

          <p>
            {projectName
              ? `${projectName} — Project performance and progress overview.`
              : "Project performance and progress overview."}
          </p>
        </div>

        <button
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
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="spms-reports-stats">
            {[
              {
                label: "Requirements",
                value: String(requirements.length),
                icon: ClipboardList,
                color: "blue",
              },
              {
                label: "Requirement Completion",
                value: `${completionPercentage.toFixed(0)}%`,
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

          {/* Requirements + Risks */}
          <div className="spms-reports-grid">
            <section className="spms-reports-card spms-reports-section">
              <h2>Requirement Progress</h2>
              <p className="spms-reports-subtitle">
                Requirements grouped by current status
              </p>

              {requirementsByStatus.map((item) => {
                const percentage =
                  requirements.length > 0
                    ? (item.count / requirements.length) * 100
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
                  risks.length > 0 ? (item.count / risks.length) * 100 : 0;

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

          {/* Development Phase Hours */}
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

          {/* Team Member Hours */}
          <section className="spms-reports-card">
            <div className="spms-reports-section-heading">
              <Users size={19} />
              <div>
                <h2>Hours by Team Member</h2>
                <p>Compare recorded effort across the project team</p>
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
                    <tr key={member.userId}>
                      <td className="spms-reports-member-name">
                        {member.name}
                      </td>
                      <td className="spms-reports-capitalize">{member.role}</td>
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

          {/* Requirement Hours */}
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
                    <tr key={item.id}>
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
