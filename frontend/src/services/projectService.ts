import { apiRequest } from "../lib/api";

export interface Project {
  id: string;
  name: string;
  description: string;
  project_manager_id: string;
  status: "planning" | "active" | "on_hold" | "completed";
  created_at: string;
  updated_at: string;
}

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>("/api/projects");
}

export async function createProject(
  name: string,
  description: string,
): Promise<Project> {
  return apiRequest<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export async function getProjectById(id: string): Promise<Project> {
  return apiRequest<Project>(`/api/projects/${id}`);
}

export async function updateProject(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: Project["status"];
  },
): Promise<Project> {
  return apiRequest<Project>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest<void>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}
