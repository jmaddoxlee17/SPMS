import { apiRequest } from "../lib/api";

export type RiskLevel = "low" | "medium" | "high";

export type RiskStatus = "identified" | "mitigating" | "resolved" | "accepted";

export interface ProjectRisk {
  id: string;
  project_id: string;
  title: string;
  description: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  mitigation_plan: string;
  status: RiskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RiskInput {
  title: string;
  description: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  mitigation_plan: string;
}

export interface UpdateRiskInput extends RiskInput {
  status: RiskStatus;
}

export const getProjectRisks = async (
  projectId: string,
): Promise<ProjectRisk[]> => {
  return apiRequest<ProjectRisk[]>(`/api/projects/${projectId}/risks`);
};

export const createProjectRisk = async (
  projectId: string,
  input: RiskInput,
): Promise<ProjectRisk> => {
  return apiRequest<ProjectRisk>(`/api/projects/${projectId}/risks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const updateProjectRisk = async (
  projectId: string,
  riskId: string,
  input: UpdateRiskInput,
): Promise<ProjectRisk> => {
  return apiRequest<ProjectRisk>(`/api/projects/${projectId}/risks/${riskId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
};

export const deleteProjectRisk = async (
  projectId: string,
  riskId: string,
): Promise<void> => {
  await apiRequest<void>(`/api/projects/${projectId}/risks/${riskId}`, {
    method: "DELETE",
  });
};
