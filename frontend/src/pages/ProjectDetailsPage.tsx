import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  Users,
  Plus,
  CalendarDays,
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  Clock3,
  BarChart3,
  UserMinus,
  Check,
  Shield,
} from "lucide-react";
import {
  getProjectById,
  updateProject,
  deleteProject,
  type Project,
} from "../services/projectService";
import {
  getProjectMembers,
  addProjectMember,
  type ProjectMember,
} from "../services/projectMemberService";
import {
  updateProjectMemberRole,
  removeProjectMember,
} from "../services/projectMemberService";
import { supabase } from "../lib/supabase";
import "./ProjectDetailsPage.css";

const statusLabels: Record<Project["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  // Project form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Project["status"]>("active");

  // Team state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Add member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"member" | "viewer">("member");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [addMemberSuccess, setAddMemberSuccess] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberRole, setSelectedMemberRole] = useState<
    "member" | "viewer"
  >("member");
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");

  async function handleSaveMemberRole(userId: string) {
    if (!projectId) return;

    setMemberActionLoading(true);
    setMemberActionError("");

    try {
      await updateProjectMemberRole(projectId, userId, selectedMemberRole);

      const updated = await getProjectMembers(projectId);
      setMembers(updated);
      setEditingMemberId(null);
    } catch (err) {
      setMemberActionError(
        err instanceof Error ? err.message : "Unable to update member role",
      );
    } finally {
      setMemberActionLoading(false);
    }
  }

  async function handleRemoveMember(member: ProjectMember) {
    if (!projectId || memberActionLoading) return;

    const confirmed = window.confirm(
      `Remove ${member.profiles?.display_name || "this user"} from the project?`,
    );

    if (!confirmed) return;

    setMemberActionLoading(true);
    setMemberActionError("");

    try {
      await removeProjectMember(projectId, member.user_id);

      const updated = await getProjectMembers(projectId);
      setMembers(updated);
    } catch (err) {
      setMemberActionError(
        err instanceof Error ? err.message : "Unable to remove team member",
      );
    } finally {
      setMemberActionLoading(false);
    }
  }

  const currentMembership = members.find(
    (member) => member.user_id === currentUserId,
  );

  const canManageTeam =
    currentMembership?.role === "owner" || currentMembership?.role === "admin";

  const canEditProject = canManageTeam;
  const canDeleteProject = currentMembership?.role === "owner";

  function populateForm(data: Project) {
    setName(data.name);
    setDescription(data.description);
    setStatus(data.status);
  }

  // Load project information
  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (!projectId) {
        setError("Missing project ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getProjectById(projectId);

        if (!active) return;

        setProject(data);
        populateForm(data);
      } catch (err) {
        if (!active) return;

        setError(err instanceof Error ? err.message : "Unable to load project");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  // Load team and current user
  useEffect(() => {
    let active = true;

    async function loadTeam() {
      if (!projectId) {
        setMembersLoading(false);
        return;
      }

      setMembersLoading(true);
      setMembersError("");

      try {
        const [team, userResult] = await Promise.all([
          getProjectMembers(projectId),
          supabase.auth.getUser(),
        ]);

        if (userResult.error) {
          throw userResult.error;
        }

        if (!active) return;

        setMembers(team);
        setCurrentUserId(userResult.data.user?.id ?? "");
      } catch (err) {
        if (!active) return;

        setMembersError(
          err instanceof Error ? err.message : "Unable to load team members",
        );
      } finally {
        if (active) setMembersLoading(false);
      }
    }

    void loadTeam();

    return () => {
      active = false;
    };
  }, [projectId]);

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const updated = await updateProject(projectId, {
        name: name.trim(),
        description,
        status,
      });

      setProject(updated);
      populateForm(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!projectId || deleting) return;

    const confirmed = window.confirm(
      `Delete "${project?.name}"?\n\n` +
        "All related project records will also be deleted. " +
        "This cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await deleteProject(projectId);
      navigate("/projects", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!projectId || !memberEmail.trim()) return;

    setAddingMember(true);
    setAddMemberError("");
    setAddMemberSuccess("");

    try {
      await addProjectMember(projectId, memberEmail.trim(), memberRole);

      const updatedMembers = await getProjectMembers(projectId);

      setMembers(updatedMembers);
      setMemberEmail("");
      setMemberRole("member");
      setShowAddMember(false);

      setAddMemberSuccess("Team member added successfully.");
    } catch (err) {
      setAddMemberError(
        err instanceof Error ? err.message : "Unable to add team member",
      );
    } finally {
      setAddingMember(false);
    }
  }

  function cancelEdit() {
    if (project) populateForm(project);
    setEditing(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="spms-details-page">
        <div className="spms-details-card spms-details-loading">
          Loading project information...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="spms-details-page">
        <div className="spms-details-alert">{error || "Project not found"}</div>
        <button
          className="spms-btn spms-btn-secondary"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>
      </div>
    );
  }

  const manager = members.find(
    (member) => member.user_id === project.project_manager_id,
  );

  return (
    <div className="spms-details-page">
      {/* Back Navigation */}
      <button className="spms-back-link" onClick={() => navigate("/projects")}>
        <ArrowLeft size={16} />
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="spms-details-card spms-project-header">
        <div className="spms-project-header-top">
          <div>
            <div className="spms-eyebrow">
              <FolderOpen size={15} />
              PROJECT DETAILS
            </div>

            <h2 className="spms-project-title">{project.name}</h2>

            <div className="spms-project-meta">
              <span className={`spms-status spms-status-${project.status}`}>
                {statusLabels[project.status]}
              </span>

              <span className="spms-meta-date">
                <CalendarDays size={15} />
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="spms-project-actions">
            {!editing && canEditProject && (
              <button
                className="spms-btn spms-btn-secondary"
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} />
                Edit Project
              </button>
            )}

            {!editing && canDeleteProject && (
              <button
                className="spms-btn spms-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {error && <div className="spms-details-alert">{error}</div>}

        {/* Project Information / Edit Form */}
        {editing ? (
          <form className="spms-project-edit" onSubmit={handleUpdate}>
            <h3>Edit Project Information</h3>

            <div className="spms-form-field">
              <label htmlFor="project-name">Project Name</label>
              <input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={150}
              />
            </div>

            <div className="spms-form-field">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="spms-form-field">
              <label htmlFor="project-status">Status</label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Project["status"])}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="spms-form-actions">
              <button
                className="spms-btn spms-btn-primary"
                type="submit"
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                className="spms-btn spms-btn-secondary"
                type="button"
                onClick={cancelEdit}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="spms-project-information">
            <div className="spms-info-item">
              <span className="spms-info-label">Project Manager</span>
              <span className="spms-info-value">
                {manager?.profiles?.display_name?.trim() || "Project Owner"}
              </span>
            </div>

            <div className="spms-info-item">
              <span className="spms-info-label">Project Status</span>
              <span className="spms-info-value">
                {statusLabels[project.status]}
              </span>
            </div>

            <div className="spms-info-item spms-info-full">
              <span className="spms-info-label">Description</span>
              <p className="spms-info-description">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Project Quick Navigation */}
      <div className="spms-project-shortcuts">
        {[
          {
            label: "Requirements",
            icon: ClipboardList,
            path: "requirements",
          },
          {
            label: "Risks",
            icon: AlertTriangle,
            path: "risks",
          },
          {
            label: "Effort Tracking",
            icon: Clock3,
            path: "effort",
          },
          {
            label: "Reports",
            icon: BarChart3,
            path: "reports",
          },
        ].map((item) => (
          <button
            key={item.path}
            className="spms-shortcut"
            onClick={() => navigate(`/projects/${projectId}/${item.path}`)}
          >
            <item.icon size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Project Team */}
      <section className="spms-details-card spms-team-section">
        <div className="spms-team-header">
          <div className="spms-team-heading">
            <div className="spms-section-icon">
              <Users size={21} />
            </div>

            <div>
              <h3>Project Team</h3>
              <p>People assigned to this project</p>
            </div>
          </div>

          <div className="spms-team-actions">
            <span className="spms-team-count">
              {members.length} {members.length === 1 ? "Member" : "Members"}
            </span>

            {canManageTeam && (
              <button
                className="spms-btn spms-btn-primary"
                onClick={() => {
                  setShowAddMember((value) => !value);
                  setAddMemberError("");
                  setAddMemberSuccess("");
                }}
              >
                {showAddMember ? <X size={16} /> : <Plus size={16} />}
                {showAddMember ? "Cancel" : "Add Member"}
              </button>
            )}
          </div>
        </div>

        {addMemberSuccess && (
          <div className="spms-success-message">{addMemberSuccess}</div>
        )}

        {/* Add Member Form */}

        {/* Add Member Form */}
        {showAddMember && canManageTeam && (
          <form className="spms-add-member-form" onSubmit={handleAddMember}>
            <h4>Add Team Member</h4>
            <p>
              Enter the email address of an existing SPMS user to add them to
              this project.
            </p>

            <div className="spms-member-form-grid">
              <div className="spms-form-field">
                <label htmlFor="member-email">Email Address</label>

                <input
                  id="member-email"
                  type="email"
                  placeholder="teammate@example.com"
                  autoComplete="off"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                  maxLength={254}
                />
              </div>

              <div className="spms-form-field">
                <label htmlFor="member-role">Project Role</label>

                <select
                  id="member-role"
                  value={memberRole}
                  onChange={(e) =>
                    setMemberRole(e.target.value as "member" | "viewer")
                  }
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {addMemberError && (
              <div className="spms-details-alert">{addMemberError}</div>
            )}

            <div className="spms-form-actions">
              <button
                className="spms-btn spms-btn-primary"
                type="submit"
                disabled={addingMember}
              >
                <Plus size={16} />
                {addingMember ? "Adding..." : "Add Team Member"}
              </button>

              <button
                className="spms-btn spms-btn-secondary"
                type="button"
                onClick={() => {
                  setShowAddMember(false);
                  setAddMemberError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        {membersLoading ? (
          <div className="spms-team-empty">Loading team members...</div>
        ) : membersError ? (
          <div className="spms-details-alert spms-team-error">
            {membersError}
          </div>
        ) : members.length === 0 ? (
          <div className="spms-team-empty">
            No team members have been assigned.
          </div>
        ) : (
          <div className="spms-team-table-wrapper">
            {memberActionError && (
              <div className="spms-details-alert spms-team-error">
                {memberActionError}
              </div>
            )}

            <table className="spms-team-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Date Joined</th>
                  {canManageTeam && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {members.map((member) => {
                  const email = member.email || "";

                  const emailName = email
                    .split("@")[0]
                    .replace(/[._-]+/g, " ")
                    .trim();

                  const displayName =
                    member.profiles?.display_name?.trim() ||
                    emailName ||
                    "Unknown User";

                  const nameParts = displayName.split(/\s+/).filter(Boolean);

                  const initials =
                    nameParts.length >= 2
                      ? (
                          nameParts[0].charAt(0) +
                          nameParts[nameParts.length - 1].charAt(0)
                        ).toUpperCase()
                      : (nameParts[0] || "U").slice(0, 2).toUpperCase();

                  const isProtectedRole =
                    member.role === "owner" || member.role === "admin";

                  const isEditing = editingMemberId === member.user_id;

                  return (
                    <tr key={member.user_id}>
                      <td>
                        <div className="spms-team-user">
                          <div className="spms-team-avatar">{initials}</div>

                          <div className="spms-team-user-info">
                            <span className="spms-team-name">
                              {displayName}
                            </span>

                            <span className="spms-team-user-id">
                              {email || "Email unavailable"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="spms-role-select"
                            value={selectedMemberRole}
                            onChange={(e) =>
                              setSelectedMemberRole(
                                e.target.value as "member" | "viewer",
                              )
                            }
                            aria-label={`Role for ${displayName}`}
                          >
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span
                            className={`spms-team-role role-${member.role}`}
                          >
                            {isProtectedRole && <Shield size={12} />}
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </span>
                        )}
                      </td>

                      <td className="spms-team-date">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>

                      {canManageTeam && (
                        <td>
                          {!isProtectedRole && (
                            <div className="spms-member-actions">
                              {isEditing ? (
                                <>
                                  <button
                                    className="spms-member-action save"
                                    disabled={memberActionLoading}
                                    onClick={() =>
                                      void handleSaveMemberRole(member.user_id)
                                    }
                                    title="Save role"
                                    aria-label={`Save role for ${displayName}`}
                                  >
                                    <Check size={16} />
                                  </button>

                                  <button
                                    className="spms-member-action"
                                    disabled={memberActionLoading}
                                    onClick={() => setEditingMemberId(null)}
                                    title="Cancel editing"
                                    aria-label="Cancel editing"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="spms-member-action"
                                    disabled={memberActionLoading}
                                    onClick={() => {
                                      setEditingMemberId(member.user_id);
                                      setSelectedMemberRole(
                                        member.role as "member" | "viewer",
                                      );
                                    }}
                                    title="Edit role"
                                    aria-label={`Edit role for ${displayName}`}
                                  >
                                    <Pencil size={16} />
                                  </button>

                                  <button
                                    className="spms-member-action danger"
                                    disabled={memberActionLoading}
                                    onClick={() =>
                                      void handleRemoveMember(member)
                                    }
                                    title="Remove member"
                                    aria-label={`Remove ${displayName}`}
                                  >
                                    <UserMinus size={16} />
                                  </button>
                                </>
                              )}
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
    </div>
  );
}
