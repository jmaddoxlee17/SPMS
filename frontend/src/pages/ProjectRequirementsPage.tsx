import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Search,
  ClipboardList,
  CheckCircle2,
  Clock3,
  FileText,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  getRequirements,
  createRequirement,
  type Requirement,
  type RequirementType,
  type RequirementStatus,
  updateRequirement,
  deleteRequirement,
} from "../services/requirementService";

import { getProjectById } from "../services/projectService";
import { supabase } from "../lib/supabase";
import { getProjectMembers } from "../services/projectMemberService";

import "./ProjectRequirementsPage.css";

const statusLabels: Record<RequirementStatus, string> = {
  proposed: "Proposed",
  approved: "Approved",
  implemented: "Implemented",
  verified: "Verified",
  rejected: "Rejected",
};

const typeLabels: Record<RequirementType, string> = {
  functional: "Functional",
  non_functional: "Non-Functional",
};

export default function ProjectRequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [canManageRequirements, setCanManageRequirements] = useState(false);
  const [canDeleteRequirements, setCanDeleteRequirements] = useState(false);

  const [editingRequirementId, setEditingRequirementId] = useState<
    string | null
  >(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [editType, setEditType] = useState<RequirementType>("functional");

  const [editStatus, setEditStatus] = useState<RequirementStatus>("proposed");

  const [editSaving, setEditSaving] = useState(false);

  const [deletingRequirementId, setDeletingRequirementId] = useState<
    string | null
  >(null);

  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirementType, setRequirementType] =
    useState<RequirementType>("functional");

  const startEditing = (requirement: Requirement) => {
    setEditingRequirementId(requirement.id);
    setEditTitle(requirement.title);
    setEditDescription(requirement.description ?? "");
    setEditType(requirement.requirement_type);
    setEditStatus(requirement.status);
    setActionError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingRequirementId(null);
    setActionError("");
  };

  const handleUpdateRequirement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !projectId ||
      !editingRequirementId ||
      !editTitle.trim() ||
      editSaving
    ) {
      return;
    }

    setEditSaving(true);
    setActionError("");
    setSuccess("");

    try {
      const updated = await updateRequirement(projectId, editingRequirementId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        requirement_type: editType,
        status: editStatus,
      });

      setRequirements((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      setEditingRequirementId(null);
      setSuccess("Requirement updated successfully.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update requirement.",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteRequirement = async (requirement: Requirement) => {
    if (!projectId || deletingRequirementId) return;

    const confirmed = window.confirm(
      `Delete requirement "${requirement.title}"?\n\n` +
        "This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingRequirementId(requirement.id);
    setActionError("");
    setSuccess("");

    try {
      await deleteRequirement(projectId, requirement.id);

      setRequirements((previous) =>
        previous.filter((item) => item.id !== requirement.id),
      );

      if (editingRequirementId === requirement.id) {
        setEditingRequirementId(null);
      }

      setSuccess("Requirement deleted successfully.");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete requirement.",
      );
    } finally {
      setDeletingRequirementId(null);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadPage() {
      if (!projectId) {
        setError("Missing project ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [project, data, userResult, members] = await Promise.all([
          getProjectById(projectId),
          getRequirements(projectId),
          supabase.auth.getUser(),
          getProjectMembers(projectId),
        ]);

        if (userResult.error) throw userResult.error;
        if (!active) return;

        setProjectName(project.name);
        setRequirements(data);

        const membership = members.find(
          (member) => member.user_id === userResult.data.user?.id,
        );

        setCanManageRequirements(
          ["owner", "admin", "member"].includes(membership?.role ?? ""),
        );
        setCanDeleteRequirements(
          ["owner", "admin"].includes(membership?.role ?? ""),
        );
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project requirements.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [projectId]);

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requirements.filter((requirement) => {
      const matchesSearch =
        !query ||
        requirement.title.toLowerCase().includes(query) ||
        (requirement.description ?? "").toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" || requirement.requirement_type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || requirement.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requirements, search, typeFilter, statusFilter]);

  const stats = {
    total: requirements.length,
    proposed: requirements.filter((r) => r.status === "proposed").length,
    implemented: requirements.filter((r) => r.status === "implemented").length,
    verified: requirements.filter((r) => r.status === "verified").length,
  };

  async function handleCreateRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId || !title.trim() || saving) return;

    setSaving(true);
    setFormError("");
    setSuccess("");

    try {
      const created = await createRequirement(projectId, {
        title: title.trim(),
        description: description.trim(),
        requirement_type: requirementType,
      });

      setRequirements((previous) => [created, ...previous]);

      setTitle("");
      setDescription("");
      setRequirementType("functional");
      setShowAddForm(false);

      setSuccess("Requirement created successfully.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create requirement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="spms-requirements-page">
      {/* Back navigation */}
      <button
        className="spms-requirements-back"
        onClick={() =>
          navigate(projectId ? `/projects/${projectId}/details` : "/projects")
        }
      >
        <ArrowLeft size={16} />
        Back to Project Details
      </button>

      {/* Heading */}
      <div className="spms-requirements-heading">
        <div>
          <div className="spms-requirements-eyebrow">
            <ClipboardList size={15} />
            PROJECT REQUIREMENTS
          </div>

          <h1>Requirements Management</h1>

          <p>
            {projectName
              ? `${projectName} — Manage functional and non-functional requirements.`
              : "Manage functional and non-functional requirements."}
          </p>
        </div>

        {canManageRequirements && (
          <button
            className="spms-btn spms-btn-primary"
            onClick={() => {
              setShowAddForm((current) => !current);
              setFormError("");
              setSuccess("");
            }}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? "Cancel" : "Add Requirement"}
          </button>
        )}
      </div>

      {error && (
        <div className="spms-requirements-alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="spms-requirements-success">
          <CheckCircle2 size={17} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="spms-requirements-card spms-requirements-empty">
          Loading requirements...
        </div>
      ) : !error ? (
        <>
          {/* Summary cards */}
          <div className="spms-requirements-stats">
            {[
              {
                label: "Total Requirements",
                count: stats.total,
                icon: ClipboardList,
                style: "total",
              },
              {
                label: "Proposed",
                count: stats.proposed,
                icon: Clock3,
                style: "proposed",
              },
              {
                label: "Implemented",
                count: stats.implemented,
                icon: FileText,
                style: "implemented",
              },
              {
                label: "Verified",
                count: stats.verified,
                icon: CheckCircle2,
                style: "verified",
              },
            ].map((stat) => (
              <div className="spms-requirements-stat" key={stat.label}>
                <div className="spms-requirements-stat-top">
                  <span className={`spms-requirements-stat-icon ${stat.style}`}>
                    <stat.icon size={20} />
                  </span>
                </div>

                <strong>{stat.count}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Create requirement */}
          {showAddForm && canManageRequirements && (
            <section className="spms-requirements-card spms-requirements-form-card">
              <div className="spms-requirements-section-heading">
                <h2>Add Requirement</h2>
                <p>Define a new requirement for this project.</p>
              </div>

              <form onSubmit={handleCreateRequirement}>
                <div className="spms-requirements-field">
                  <label htmlFor="requirement-title">Requirement Title</label>

                  <input
                    id="requirement-title"
                    type="text"
                    placeholder="e.g. User Authentication"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="spms-requirements-field">
                  <label htmlFor="requirement-type">Requirement Type</label>

                  <select
                    id="requirement-type"
                    value={requirementType}
                    onChange={(e) =>
                      setRequirementType(e.target.value as RequirementType)
                    }
                  >
                    <option value="functional">Functional Requirement</option>
                    <option value="non_functional">
                      Non-Functional Requirement
                    </option>
                  </select>
                </div>

                <div className="spms-requirements-field">
                  <label htmlFor="requirement-description">Description</label>

                  <textarea
                    id="requirement-description"
                    rows={4}
                    placeholder="Describe what this requirement should achieve..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={10000}
                  />
                </div>

                {formError && (
                  <div className="spms-requirements-alert">
                    <AlertCircle size={17} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="spms-requirements-form-actions">
                  <button
                    type="submit"
                    className="spms-btn spms-btn-primary"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? "Creating..." : "Create Requirement"}
                  </button>

                  <button
                    type="button"
                    className="spms-btn spms-btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Edit Requirement */}
          {editingRequirementId && canManageRequirements && (
            <section className="spms-requirements-card spms-requirements-form-card">
              <div className="spms-requirements-section-heading">
                <h2>Edit Requirement</h2>
                <p>Update the requirement details and progress status.</p>
              </div>

              <form onSubmit={handleUpdateRequirement}>
                <div className="spms-requirements-field">
                  <label htmlFor="edit-requirement-title">
                    Requirement Title
                  </label>
                  <input
                    id="edit-requirement-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="spms-requirements-edit-grid">
                  <div className="spms-requirements-field">
                    <label htmlFor="edit-requirement-type">
                      Requirement Type
                    </label>
                    <select
                      id="edit-requirement-type"
                      value={editType}
                      onChange={(e) =>
                        setEditType(e.target.value as RequirementType)
                      }
                    >
                      <option value="functional">Functional</option>
                      <option value="non_functional">Non-Functional</option>
                    </select>
                  </div>

                  <div className="spms-requirements-field">
                    <label htmlFor="edit-requirement-status">Status</label>
                    <select
                      id="edit-requirement-status"
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as RequirementStatus)
                      }
                    >
                      <option value="proposed">Proposed</option>
                      <option value="approved">Approved</option>
                      <option value="implemented">Implemented</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="spms-requirements-field">
                  <label htmlFor="edit-requirement-description">
                    Description
                  </label>
                  <textarea
                    id="edit-requirement-description"
                    rows={4}
                    value={editDescription}
                    maxLength={10000}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                {actionError && !editingRequirementId && (
                  <div className="spms-requirements-alert" role="alert">
                    <AlertCircle size={17} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="spms-requirements-form-actions">
                  <button
                    className="spms-btn spms-btn-primary"
                    type="submit"
                    disabled={editSaving}
                  >
                    <Save size={16} />
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    className="spms-btn spms-btn-secondary"
                    type="button"
                    onClick={cancelEditing}
                    disabled={editSaving}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Requirements table */}
          <section className="spms-requirements-card">
            <div className="spms-requirements-table-header">
              <div>
                <h2>All Requirements</h2>
                <p>
                  {filteredRequirements.length} of {requirements.length}{" "}
                  requirements
                </p>
              </div>
            </div>

            <div className="spms-requirements-filters">
              <div className="spms-requirements-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search requirements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search requirements"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by requirement type"
              >
                <option value="all">All Types</option>
                <option value="functional">Functional</option>
                <option value="non_functional">Non-Functional</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by requirement status"
              >
                <option value="all">All Statuses</option>
                <option value="proposed">Proposed</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredRequirements.length === 0 ? (
              <div className="spms-requirements-empty">
                <ClipboardList size={32} />
                <h3>
                  {requirements.length === 0
                    ? "No requirements yet"
                    : "No matching requirements"}
                </h3>
                <p>
                  {requirements.length === 0
                    ? "Create your first requirement to begin tracking project scope."
                    : "Try changing your search or filters."}
                </p>
              </div>
            ) : (
              <div className="spms-requirements-table-wrapper">
                <table className="spms-requirements-table">
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      {canManageRequirements && <th>Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequirements.map((requirement) => (
                      <tr key={requirement.id}>
                        <td>
                          <div className="spms-requirements-name">
                            {requirement.title}
                          </div>
                          <div className="spms-requirements-description">
                            {requirement.description || "No description"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`spms-requirements-type type-${requirement.requirement_type}`}
                          >
                            {typeLabels[requirement.requirement_type]}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`spms-requirements-status status-${requirement.status}`}
                          >
                            {statusLabels[requirement.status]}
                          </span>
                        </td>

                        <td className="spms-requirements-date">
                          {new Date(
                            requirement.created_at,
                          ).toLocaleDateString()}
                        </td>

                        {canManageRequirements && (
                          <td>
                            <div className="spms-requirements-row-actions">
                              <button
                                type="button"
                                className="spms-requirements-action-button"
                                title="Edit requirement"
                                aria-label={`Edit ${requirement.title}`}
                                onClick={() => startEditing(requirement)}
                                disabled={editSaving || !!deletingRequirementId}
                              >
                                <Pencil size={16} />
                              </button>

                              {canDeleteRequirements && (
                                <button
                                  type="button"
                                  className="spms-requirements-action-button danger"
                                  title="Delete requirement"
                                  aria-label={`Delete ${requirement.title}`}
                                  onClick={() =>
                                    void handleDeleteRequirement(requirement)
                                  }
                                  disabled={
                                    editSaving || !!deletingRequirementId
                                  }
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
