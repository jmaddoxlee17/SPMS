import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { getProjectById } from "../services/projectService";
import { getProjectMembers } from "../services/projectMemberService";
import {
  getRequirements,
  type Requirement,
} from "../services/requirementService";

import {
  getEffortEntries,
  createEffortEntry,
  updateEffortEntry,
  deleteEffortEntry,
  type EffortEntry,
  type EffortInput,
  type EffortCategory,
  type EffortPeriod,
} from "../services/effortService";

import "./EffortTrackingPage.css";

const phaseLabels: Record<EffortCategory, string> = {
  requirement_analysis: "Requirements Analysis",
  design: "Design",
  coding: "Coding",
  testing: "Testing",
  project_management: "Project Management",
};

const phases = Object.keys(phaseLabels) as EffortCategory[];

const initialForm = (): EffortInput => ({
  period_type: "daily",
  period_start: new Date().toLocaleDateString("en-CA"),
  category: "coding",
  requirement_id: null,
  hours: 1,
  notes: "",
});

const formatHours = (hours: number): string => hours.toFixed(2);

export default function EffortTrackingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [entries, setEntries] = useState<EffortEntry[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [canLog, setCanLog] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EffortInput>(initialForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      if (!projectId) {
        setError("Missing project ID");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [project, effort, reqs, auth, members] = await Promise.all([
          getProjectById(projectId),
          getEffortEntries(projectId),
          getRequirements(projectId),
          supabase.auth.getUser(),
          getProjectMembers(projectId),
        ]);

        if (auth.error) throw auth.error;
        if (!active) return;

        const userId = auth.data.user?.id ?? "";
        const membership = members.find((member) => member.user_id === userId);

        setProjectName(project.name);
        setEntries(effort);
        setRequirements(reqs);
        setCurrentUserId(userId);
        setCanLog(
          ["owner", "admin", "member"].includes(membership?.role ?? ""),
        );
        setError("");
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load effort tracking",
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

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.hours), 0),
    [entries],
  );

  const myHours = useMemo(
    () =>
      entries
        .filter((entry) => entry.user_id === currentUserId)
        .reduce((sum, entry) => sum + Number(entry.hours), 0),
    [entries, currentUserId],
  );

  const hoursByPhase = useMemo(
    () =>
      phases.map((phase) => ({
        phase,
        total: entries
          .filter((entry) => entry.category === phase)
          .reduce((sum, entry) => sum + Number(entry.hours), 0),
      })),
    [entries],
  );

  const hoursByRequirement = useMemo(
    () =>
      requirements
        .map((requirement) => ({
          id: requirement.id,
          title: requirement.title,
          total: entries
            .filter((entry) => entry.requirement_id === requirement.id)
            .reduce((sum, entry) => sum + Number(entry.hours), 0),
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total),
    [entries, requirements],
  );

  const filteredEntries = useMemo(() => {
    const query = search.toLowerCase().trim();

    return entries.filter((entry) => {
      const requirement = requirements.find(
        (r) => r.id === entry.requirement_id,
      );

      const matchesSearch =
        !query ||
        (entry.notes ?? "").toLowerCase().includes(query) ||
        phaseLabels[entry.category].toLowerCase().includes(query) ||
        (requirement?.title ?? "").toLowerCase().includes(query);

      return (
        matchesSearch &&
        (phaseFilter === "all" || entry.category === phaseFilter)
      );
    });
  }, [entries, requirements, search, phaseFilter]);

  const updateField = <K extends keyof EffortInput>(
    field: K,
    value: EffortInput[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const startAdding = () => {
    setEditingId(null);
    setForm(initialForm());
    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const startEditing = (entry: EffortEntry) => {
    if (entry.user_id !== currentUserId) return;

    setEditingId(entry.id);
    setForm({
      period_type: entry.period_type,
      period_start: entry.period_start,
      category: entry.category,
      requirement_id: entry.requirement_id,
      hours: Number(entry.hours),
      notes: entry.notes ?? "",
    });
    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId || !canLog || saving) return;

    setSaving(true);
    setFormError("");
    setSuccess("");

    try {
      if (editingId) {
        const updated = await updateEffortEntry(projectId, editingId, form);

        setEntries((previous) =>
          previous.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        setSuccess("Effort entry updated successfully.");
      } else {
        const created = await createEffortEntry(projectId, form);

        setEntries((previous) => [created, ...previous]);
        setSuccess("Effort entry recorded successfully.");
      }

      cancelForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save effort entry",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: EffortEntry) => {
    if (
      !projectId ||
      !canLog ||
      entry.user_id !== currentUserId ||
      deletingId
    ) {
      return;
    }

    if (!window.confirm("Delete this effort entry?")) return;

    setDeletingId(entry.id);
    setError("");
    setSuccess("");

    try {
      await deleteEffortEntry(projectId, entry.id);
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      setSuccess("Effort entry deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete effort entry",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="spms-effort-page">
      <button
        className="spms-effort-back"
        onClick={() =>
          navigate(projectId ? `/projects/${projectId}/details` : "/projects")
        }
      >
        <ArrowLeft size={16} />
        Back to Project Details
      </button>

      <header className="spms-effort-heading">
        <div>
          <div className="spms-effort-eyebrow">
            <Clock3 size={15} />
            PROJECT EFFORT
          </div>
          <h1>Effort Tracking</h1>
          <p>
            {projectName
              ? `${projectName} — Track daily and weekly person-hours.`
              : "Track daily and weekly person-hours."}
          </p>
        </div>

        {canLog && !loading && (
          <button
            className="spms-btn spms-btn-primary"
            onClick={() => {
              if (showForm) cancelForm();
              else startAdding();
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Log Hours"}
          </button>
        )}
      </header>

      {error && (
        <div className="spms-effort-alert" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="spms-effort-success" role="status">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {loading ? (
        <section className="spms-effort-card spms-effort-empty">
          Loading effort entries...
        </section>
      ) : (
        <>
          <div className="spms-effort-stats">
            {[
              { label: "Total Hours", value: formatHours(totalHours) },
              { label: "My Hours", value: formatHours(myHours) },
              { label: "Entries", value: String(entries.length) },
            ].map((item) => (
              <div className="spms-effort-stat" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {showForm && canLog && (
            <section className="spms-effort-card spms-effort-form-card">
              <h2>{editingId ? "Edit Effort Entry" : "Log Work Hours"}</h2>
              <p>Record the time you spent working on this project.</p>

              <form onSubmit={handleSave}>
                <div className="spms-effort-form-grid">
                  <div className="spms-effort-field">
                    <label htmlFor="effort-period">Period</label>
                    <select
                      id="effort-period"
                      value={form.period_type}
                      onChange={(e) =>
                        updateField(
                          "period_type",
                          e.target.value as EffortPeriod,
                        )
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">
                        {form.period_type === "daily"
                          ? "Work Date"
                          : "Week Start Date (Monday)"}
                      </option>
                    </select>
                  </div>

                  <div className="spms-effort-field">
                    <label htmlFor="effort-date">
                      {form.period_type === "daily"
                        ? "Work Date"
                        : "Week Start Date"}
                    </label>
                    <input
                      id="effort-date"
                      type="date"
                      value={form.period_start}
                      onChange={(e) =>
                        updateField("period_start", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="spms-effort-field">
                    <label htmlFor="effort-category">Development Phase</label>
                    <select
                      id="effort-category"
                      value={form.category}
                      onChange={(e) =>
                        updateField(
                          "category",
                          e.target.value as EffortCategory,
                        )
                      }
                    >
                      {phases.map((phase) => (
                        <option key={phase} value={phase}>
                          {phaseLabels[phase]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="spms-effort-field">
                    <label htmlFor="effort-hours">Hours</label>
                    <input
                      id="effort-hours"
                      type="number"
                      min="0.01"
                      max={form.period_type === "daily" ? "24" : "168"}
                      step="0.01"
                      value={form.hours}
                      onChange={(e) =>
                        updateField("hours", Number(e.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="spms-effort-field">
                  <label htmlFor="effort-requirement">
                    Associated Requirement
                  </label>
                  <select
                    id="effort-requirement"
                    value={form.requirement_id ?? ""}
                    onChange={(e) =>
                      updateField("requirement_id", e.target.value || null)
                    }
                  >
                    <option value="">General Project Work</option>
                    {requirements.map((requirement) => (
                      <option key={requirement.id} value={requirement.id}>
                        {requirement.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="spms-effort-field">
                  <label htmlFor="effort-notes">Work Description</label>
                  <textarea
                    id="effort-notes"
                    rows={3}
                    maxLength={5000}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Describe the work completed..."
                  />
                </div>

                {formError && (
                  <div className="spms-effort-alert" role="alert">
                    {formError}
                  </div>
                )}

                <div className="spms-effort-form-actions">
                  <button
                    className="spms-btn spms-btn-primary"
                    type="submit"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Save Effort"}
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

          <section className="spms-effort-card spms-effort-summary">
            <h2>Hours by Development Phase</h2>

            {hoursByPhase.map((item) => {
              const percentage =
                totalHours > 0 ? (item.total / totalHours) * 100 : 0;

              return (
                <div className="spms-effort-phase" key={item.phase}>
                  <div className="spms-effort-phase-info">
                    <span>{phaseLabels[item.phase]}</span>
                    <strong>{formatHours(item.total)} hrs</strong>
                  </div>
                  <div className="spms-effort-progress">
                    <div
                      className="spms-effort-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          <section className="spms-effort-card spms-effort-summary">
            <h2>Hours by Requirement</h2>
            {hoursByRequirement.length === 0 ? (
              <p className="spms-effort-muted">
                No hours have been assigned to requirements yet.
              </p>
            ) : (
              <div className="spms-effort-requirement-list">
                {hoursByRequirement.map((item) => (
                  <div className="spms-effort-requirement" key={item.id}>
                    <span>{item.title}</span>
                    <strong>{formatHours(item.total)} hrs</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="spms-effort-card">
            <div className="spms-effort-table-heading">
              <div>
                <h2>Effort Entries</h2>
                <p>
                  {filteredEntries.length} of {entries.length} entries
                </p>
              </div>
            </div>

            <div className="spms-effort-filters">
              <div className="spms-effort-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search work entries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                aria-label="Filter by development phase"
              >
                <option value="all">All Phases</option>
                {phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phaseLabels[phase]}
                  </option>
                ))}
              </select>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="spms-effort-empty">
                <Clock3 size={30} />
                <h3>No matching effort entries</h3>
                <p>Log work hours or adjust your filters.</p>
              </div>
            ) : (
              <div className="spms-effort-table-wrapper">
                <table className="spms-effort-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Period</th>
                      <th>Development Phase</th>
                      <th>Requirement / Notes</th>
                      <th>Hours</th>
                      {canLog && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const requirement = requirements.find(
                        (r) => r.id === entry.requirement_id,
                      );

                      const isOwnEntry = entry.user_id === currentUserId;

                      return (
                        <tr key={entry.id}>
                          <td>{entry.period_start}</td>
                          <td className="spms-effort-capitalize">
                            {entry.period_type}
                          </td>
                          <td>{phaseLabels[entry.category]}</td>
                          <td>
                            <div className="spms-effort-entry-title">
                              {requirement?.title ?? "General Project Work"}
                            </div>
                            <div className="spms-effort-muted">
                              {entry.notes || "No notes"}
                            </div>
                          </td>
                          <td className="spms-effort-hours">
                            {formatHours(Number(entry.hours))}
                          </td>
                          {canLog && (
                            <td>
                              {isOwnEntry && (
                                <div className="spms-effort-actions">
                                  <button
                                    className="spms-effort-icon-button"
                                    type="button"
                                    aria-label="Edit effort entry"
                                    title="Edit entry"
                                    disabled={saving || !!deletingId}
                                    onClick={() => startEditing(entry)}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    className="spms-effort-icon-button danger"
                                    type="button"
                                    aria-label="Delete effort entry"
                                    title="Delete entry"
                                    disabled={saving || !!deletingId}
                                    onClick={() => void handleDelete(entry)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
