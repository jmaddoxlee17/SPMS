import { apiRequest } from "../lib/api";

export type RequirementType = "functional" | "non_functional";

export type RequirementStatus =
  | "proposed"
  | "approved"
  | "implemented"
  | "verified"
  | "rejected";

export interface Requirement {
  id: string;
  project_id: string;
  title: string;
  description: string;
  requirement_type: RequirementType;
  status: RequirementStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getRequirements(
  projectId: string,
): Promise<Requirement[]> {
  return apiRequest<Requirement[]>(`/api/projects/${projectId}/requirements`);
}

export async function createRequirement(
  projectId: string,
  input: {
    title: string;
    description: string;
    requirement_type: RequirementType;
  },
): Promise<Requirement> {
  return apiRequest<Requirement>(`/api/projects/${projectId}/requirements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateRequirementInput {
  title: string;
  description: string;
  requirement_type: RequirementType;
  status: RequirementStatus;
}

export async function updateRequirement(
  projectId: string,
  requirementId: string,
  input: UpdateRequirementInput,
): Promise<Requirement> {
  return apiRequest<Requirement>(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function deleteRequirement(
  projectId: string,
  requirementId: string,
): Promise<void> {
  await apiRequest<void>(
    `/api/projects/${projectId}/requirements/${requirementId}`,
    {
      method: "DELETE",
    },
  );
}
