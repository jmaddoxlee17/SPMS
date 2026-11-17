import { apiRequest } from "../lib/api";

export type EffortPeriod = "daily" | "weekly";

export type EffortCategory =
  | "requirement_analysis"
  | "design"
  | "coding"
  | "testing"
  | "project_management";

export interface EffortEntry {
  id: string;
  project_id: string;
  user_id: string;
  period_type: EffortPeriod;
  period_start: string;
  category: EffortCategory;
  requirement_id: string | null;
  hours: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EffortInput {
  period_type: EffortPeriod;
  period_start: string;
  category: EffortCategory;
  requirement_id: string | null;
  hours: number;
  notes: string;
}

export const getEffortEntries = async (
  projectId: string,
): Promise<EffortEntry[]> =>
  apiRequest<EffortEntry[]>(`/api/projects/${projectId}/effort`);

export const createEffortEntry = async (
  projectId: string,
  input: EffortInput,
): Promise<EffortEntry> =>
  apiRequest<EffortEntry>(`/api/projects/${projectId}/effort`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateEffortEntry = async (
  projectId: string,
  entryId: string,
  input: EffortInput,
): Promise<EffortEntry> =>
  apiRequest<EffortEntry>(`/api/projects/${projectId}/effort/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteEffortEntry = async (
  projectId: string,
  entryId: string,
): Promise<void> => {
  await apiRequest<void>(`/api/projects/${projectId}/effort/${entryId}`, {
    method: "DELETE",
  });
};
