import { apiRequest } from "../lib/api";

export interface ProjectReport {
  project: {
    id: string;
    name: string;
  };

  summary: {
    total_requirements: number;
    completed_requirements: number;
    requirement_completion_percentage: number;
    total_risks: number;
    open_risks: number;
    total_hours: number;
    total_entries: number;
    total_members: number;
  };

  requirements_by_status: {
    status: string;
    count: number;
  }[];

  risks_by_status: {
    status: string;
    count: number;
  }[];

  hours_by_phase: {
    category: string;
    hours: number;
  }[];

  hours_by_member: {
    user_id: string;
    display_name: string;
    role: string;
    hours: number;
  }[];

  hours_by_requirement: {
    requirement_id: string;
    title: string;
    hours: number;
  }[];

  general_hours: number;
}

export const getProjectReport = async (
  projectId: string,
): Promise<ProjectReport> => {
  return apiRequest<ProjectReport>(`/api/projects/${projectId}/reports`);
};
