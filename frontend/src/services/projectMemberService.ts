import { apiRequest } from "../lib/api";

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export interface ProjectMember {
  project_id: string;
  user_id: string;
  email: string;
  role: ProjectRole;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string;
  } | null;
}

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[]>(`/api/projects/${projectId}/members`);
}

export async function addProjectMember(
  projectId: string,
  email: string,
  role: "member" | "viewer",
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      role,
    }),
  });
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: "member" | "viewer",
): Promise<ProjectMember> {
  return apiRequest<ProjectMember>(
    `/api/projects/${projectId}/members/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  return apiRequest<void>(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}
