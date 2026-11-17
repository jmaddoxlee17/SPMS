import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { getProjectById } from "../services/projectService";
import { getProjectMembers } from "../services/projectMemberService";
import {
  getProjectRisks,
  createProjectRisk,
  updateProjectRisk,
  deleteProjectRisk,
  type ProjectRisk,
  type RiskLevel,
  type RiskStatus,
  type UpdateRiskInput,
} from "../services/projectRiskService";

import "./RisksPage.css";

const statusLabels: Record<RiskStatus, string> = {
  identified: "Identified",
  mitigating: "Mitigating",
  resolved: "Resolved",
  accepted: "Accepted",
};

const emptyForm = (): UpdateRiskInput => ({
  title: "",
  description: "",
  likelihood: "medium",
  impact: "medium",
  mitigation_plan: "",
  status: "identified",
});

const riskScore = (risk: ProjectRisk): number => {
  const scores: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return scores[risk.likelihood] * scores[risk.impact];
};

export default function RisksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateRiskInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      if (!projectId) {
        setError("Missing project ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [project, data, authResult, members] = await Promise.all([
          getProjectById(projectId),
          getProjectRisks(projectId),
          supabase.auth.getUser(),
          getProjectMembers(projectId),
        ]);

        if (authResult.error) {
          throw authResult.error;
        }

        if (!active) return;

        const membership = members.find(
          (member) => member.user_id === authResult.data.user?.id,
        );

        setProjectName(project.name);
        setRisks(data);
        setCanEdit(
          ["owner", "admin", "member"].includes(membership?.role ?? ""),
        );
        setCanDelete(["owner", "admin"].includes(membership?.role ?? ""));
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load project risks.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPage();

    return () => {
      active = false;
    };
  }, [projectId]);

  const filteredRisks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return risks.filter((risk) => {
      const matchesSearch =
        !query ||
        risk.title.toLowerCase().includes(query) ||
        (risk.description ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || risk.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [risks, search, statusFilter]);

  const highPriorityCount = risks.filter(
    (risk) =>
      risk.status !== "resolved" &&
      risk.status !== "accepted" &&
      riskScore(risk) >= 6,
  ).length;

  const mitigatingCount = risks.filter(
    (risk) => risk.status === "mitigating",
  ).length;

  const resolvedCount = risks.filter(
    (risk) => risk.status === "resolved",
  ).length;

  const updateField = <K extends keyof UpdateRiskInput>(
    field: K,
    value: UpdateRiskInput[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const startAdding = () => {
    setForm(emptyForm());
    setEditingRiskId(null);
    setFormError("");
    setNotice("");
    setShowForm(true);
  };

  const startEditing = (risk: ProjectRisk) => {
    setEditingRiskId(risk.id);
    setForm({
      title: risk.title,
      description: risk.description ?? "",
      likelihood: risk.likelihood,
      impact: risk.impact,
      mitigation_plan: risk.mitigation_plan ?? "",
      status: risk.status,
    });
    setFormError("");
    setNotice("");
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingRiskId(null);
    setFormError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId || !canEdit || !form.title.trim() || saving) {
      return;
    }

    setSaving(true);
    setFormError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        mitigation_plan: form.mitigation_plan.trim(),
      };

      if (editingRiskId) {
        const updated = await updateProjectRisk(
          projectId,
          editingRiskId,
          payload,
        );

        setRisks((previous) =>
          previous.map((risk) => (risk.id === updated.id ? updated : risk)),
        );
        setNotice("Risk updated successfully.");
      } else {
        const created = await createProjectRisk(projectId, payload);

        setRisks((previous) => [created, ...previous]);
        setNotice("Risk created successfully.");
      }

      cancelForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save risk.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (risk: ProjectRisk) => {
    if (!projectId || !canDelete || deletingRiskId) return;

    const confirmed = window.confirm(
      `Delete risk "${risk.title}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingRiskId(risk.id);
    setError("");
    setNotice("");

    try {
      await deleteProjectRisk(projectId, risk.id);

      setRisks((previous) => previous.filter((item) => item.id !== risk.id));

      if (editingRiskId === risk.id) {
        cancelForm();
      }

      setNotice("Risk deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete risk.");
    } finally {
      setDeletingRiskId(null);
    }
  };

  const getPriority = (risk: ProjectRisk) => {
    const score = riskScore(risk);

    if (score >= 6) return "high";
    if (score >= 3) return "medium";
    return "low";
  };

  return (
    <div className="spms-risks-page">
      <button
        className="spms-risks-back"
        onClick={() =>
          navigate(projectId ? `/projects/${projectId}/details` : "/projects")
        }
      >
        <ArrowLeft size={16} />
        Back to Project Details
      </button>

      <div className="spms-risks-heading">
        <div>
          <div className="spms-risks-eyebrow">
            <AlertTriangle size={15} />
            PROJECT RISKS
          </div>
          <h1>Risk Management</h1>
          <p>
            {projectName
              ? `${projectName} — Identify and manage project risks.`
              : "Identify and manage project risks."}
          </p>
        </div>

        {canEdit && (
          <button
            className="spms-btn spms-btn-primary"
            onClick={() => {
              if (showForm) cancelForm();
              else startAdding();
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Add Risk"}
          </button>
        )}
      </div>

      {error && (
        <div className="spms-risks-alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="spms-risks-success" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}

      {loading ? (
        <div className="spms-risks-card spms-risks-empty">
          Loading project risks...
        </div>
      ) : !error || risks.length > 0 ? (
        <>
          <div className="spms-risks-stats">
            {[
              { label: "Total Risks", value: risks.length },
              {
                label: "High Priority",
                value: highPriorityCount,
              },
              {
                label: "Mitigating",
                value: mitigatingCount,
              },
              {
                label: "Resolved",
                value: resolvedCount,
              },
            ].map((stat) => (
              <div className="spms-risks-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {showForm && canEdit && (
            <section className="spms-risks-card spms-risks-form-card">
              <h2>{editingRiskId ? "Edit Risk" : "Add New Risk"}</h2>
              <p>
                Describe the issue, assess its probability and impact, and
                define a mitigation plan.
              </p>

              <form onSubmit={handleSave}>
                <div className="spms-risks-field">
                  <label htmlFor="risk-title">Risk Title</label>
                  <input
                    id="risk-title"
                    value={form.title}
                    maxLength={200}
                    required
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g. Schedule delays"
                  />
                </div>

                <div className="spms-risks-field">
                  <label htmlFor="risk-description">Description</label>
                  <textarea
                    id="risk-description"
                    rows={3}
                    maxLength={10000}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="What could happen and why?"
                  />
                </div>

                <div className="spms-risks-form-grid">
                  <div className="spms-risks-field">
                    <label htmlFor="risk-likelihood">Likelihood</label>
                    <select
                      id="risk-likelihood"
                      value={form.likelihood}
                      onChange={(e) =>
                        updateField("likelihood", e.target.value as RiskLevel)
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="spms-risks-field">
                    <label htmlFor="risk-impact">Impact</label>
                    <select
                      id="risk-impact"
                      value={form.impact}
                      onChange={(e) =>
                        updateField("impact", e.target.value as RiskLevel)
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {editingRiskId && (
                  <div className="spms-risks-field">
                    <label htmlFor="risk-status">Status</label>
                    <select
                      id="risk-status"
                      value={form.status}
                      onChange={(e) =>
                        updateField("status", e.target.value as RiskStatus)
                      }
                    >
                      <option value="identified">Identified</option>
                      <option value="mitigating">Mitigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </div>
                )}

                <div className="spms-risks-field">
                  <label htmlFor="risk-mitigation">Mitigation Plan</label>
                  <textarea
                    id="risk-mitigation"
                    rows={4}
                    maxLength={10000}
                    value={form.mitigation_plan}
                    onChange={(e) =>
                      updateField("mitigation_plan", e.target.value)
                    }
                    placeholder="Describe how the team will reduce or handle this risk..."
                  />
                </div>

                {formError && (
                  <div className="spms-risks-alert" role="alert">
                    {formError}
                  </div>
                )}

                <div className="spms-risks-form-actions">
                  <button
                    className="spms-btn spms-btn-primary"
                    type="submit"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving
                      ? "Saving..."
                      : editingRiskId
                        ? "Save Changes"
                        : "Create Risk"}
                  </button>
                  <button
                    className="spms-btn spms-btn-secondary"
                    type="button"
                    onClick={cancelForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="spms-risks-card">
            <div className="spms-risks-table-heading">
              <div>
                <h2>Risk Register</h2>
                <p>
                  {filteredRisks.length} of {risks.length} risks
                </p>
              </div>
            </div>

            <div className="spms-risks-filters">
              <div className="spms-risks-search">
                <Search size={17} />
                <input
                  type="search"
                  value={search}
                  placeholder="Search risks..."
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search risks"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="identified">Identified</option>
                <option value="mitigating">Mitigating</option>
                <option value="resolved">Resolved</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            {filteredRisks.length === 0 ? (
              <div className="spms-risks-empty">
                <AlertTriangle size={30} />
                <h3>
                  {risks.length === 0
                    ? "No project risks yet"
                    : "No matching risks"}
                </h3>
                <p>
                  {risks.length === 0
                    ? "Add your first risk to begin tracking potential project issues."
                    : "Try adjusting your search or status filter."}
                </p>
              </div>
            ) : (
              <div className="spms-risks-table-wrapper">
                <table className="spms-risks-table">
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Likelihood</th>
                      <th>Impact</th>
                      <th>Priority</th>
                      <th>Status</th>
                      {canEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map((risk) => (
                      <tr key={risk.id}>
                        <td>
                          <div className="spms-risks-name">{risk.title}</div>
                          <div className="spms-risks-description">
                            {risk.description || "No description provided"}
                          </div>
                          {risk.mitigation_plan && (
                            <div className="spms-risks-mitigation">
                              Mitigation: {risk.mitigation_plan}
                            </div>
                          )}
                        </td>
                        <td className="spms-risks-capitalize">
                          {risk.likelihood}
                        </td>
                        <td className="spms-risks-capitalize">{risk.impact}</td>
                        <td>
                          <span
                            className={`spms-risk-tag priority-${getPriority(risk)}`}
                          >
                            {getPriority(risk)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`spms-risk-tag status-${risk.status}`}
                          >
                            {statusLabels[risk.status]}
                          </span>
                        </td>

                        {canEdit && (
                          <td>
                            <div className="spms-risks-actions">
                              <button
                                className="spms-risks-icon-button"
                                type="button"
                                title="Edit risk"
                                aria-label={`Edit ${risk.title}`}
                                onClick={() => startEditing(risk)}
                                disabled={saving || !!deletingRiskId}
                              >
                                <Pencil size={16} />
                              </button>

                              {canDelete && (
                                <button
                                  className="spms-risks-icon-button danger"
                                  type="button"
                                  title="Delete risk"
                                  aria-label={`Delete ${risk.title}`}
                                  onClick={() => void handleDelete(risk)}
                                  disabled={saving || !!deletingRiskId}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
