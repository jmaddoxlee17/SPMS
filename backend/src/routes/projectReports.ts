import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const categories = [
  "requirement_analysis",
  "design",
  "coding",
  "testing",
  "project_management",
] as const;

const requirementStatuses = [
  "proposed",
  "approved",
  "implemented",
  "verified",
  "rejected",
] as const;

const riskStatuses = [
  "identified",
  "mitigating",
  "resolved",
  "accepted",
] as const;

const toHours = (value: unknown): number => {
  const hours = Number(value);
  return Number.isFinite(hours) ? hours : 0;
};

// GET /api/projects/:projectId/reports
router.get(
  "/:projectId/reports",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);

      // Verify project visibility through RLS.
      const { data: project, error: projectError } = await req
        .supabase!.from("projects")
        .select("id, name")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) throw projectError;

      if (!project) {
        res.status(404).json({
          error: "Project not found or access denied",
        });
        return;
      }

      const [requirementResult, riskResult, effortResult, memberResult] =
        await Promise.all([
          req
            .supabase!.from("requirements")
            .select("id, title, requirement_type, status")
            .eq("project_id", projectId),

          req
            .supabase!.from("project_risks")
            .select("id, likelihood, impact, status")
            .eq("project_id", projectId),

          req
            .supabase!.from("effort_entries")
            .select("user_id, category, requirement_id, hours")
            .eq("project_id", projectId),

          req
            .supabase!.from("project_members")
            .select("user_id, role, profiles(id, display_name)")
            .eq("project_id", projectId),
        ]);

      if (requirementResult.error) throw requirementResult.error;
      if (riskResult.error) throw riskResult.error;
      if (effortResult.error) throw effortResult.error;
      if (memberResult.error) throw memberResult.error;

      const requirements = requirementResult.data ?? [];
      const risks = riskResult.data ?? [];
      const entries = effortResult.data ?? [];
      const members = memberResult.data ?? [];

      const sumHours = (rows: Array<{ hours: unknown }>): number =>
        Math.round(
          rows.reduce((sum, row) => sum + toHours(row.hours), 0) * 100,
        ) / 100;

      const totalHours = sumHours(entries);

      const completedRequirements = requirements.filter(
        (r) => r.status === "implemented" || r.status === "verified",
      ).length;

      const requirementCompletion =
        requirements.length > 0
          ? Math.round((completedRequirements / requirements.length) * 100)
          : 0;

      const openRisks = risks.filter(
        (r) => r.status === "identified" || r.status === "mitigating",
      ).length;

      const requirementsByStatus = requirementStatuses.map((status) => ({
        status,
        count: requirements.filter((r) => r.status === status).length,
      }));

      const risksByStatus = riskStatuses.map((status) => ({
        status,
        count: risks.filter((r) => r.status === status).length,
      }));

      const hoursByPhase = categories.map((category) => ({
        category,
        hours: sumHours(entries.filter((entry) => entry.category === category)),
      }));

      const memberIds = Array.from(
        new Set([
          ...members.map((member) => member.user_id),
          ...entries.map((entry) => entry.user_id),
        ]),
      );

      const hoursByMember = memberIds
        .map((userId) => {
          const membership = members.find(
            (member) => member.user_id === userId,
          );

          // Supabase may infer this relationship
          // as an object or an array.
          const profileData = membership?.profiles;
          const profile = Array.isArray(profileData)
            ? profileData[0]
            : profileData;

          return {
            user_id: userId,
            display_name: profile?.display_name || "Former or Unnamed Member",
            role: membership?.role || "former_member",
            hours: sumHours(
              entries.filter((entry) => entry.user_id === userId),
            ),
          };
        })
        .sort((a, b) => b.hours - a.hours);

      const hoursByRequirement = requirements
        .map((requirement) => ({
          requirement_id: requirement.id,
          title: requirement.title,
          hours: sumHours(
            entries.filter((entry) => entry.requirement_id === requirement.id),
          ),
        }))
        .sort((a, b) => b.hours - a.hours);

      const generalHours = sumHours(
        entries.filter((entry) => entry.requirement_id === null),
      );

      res.status(200).json({
        project: {
          id: project.id,
          name: project.name,
        },
        summary: {
          total_requirements: requirements.length,
          completed_requirements: completedRequirements,
          requirement_completion_percentage: requirementCompletion,
          total_risks: risks.length,
          open_risks: openRisks,
          total_hours: totalHours,
          total_entries: entries.length,
          total_members: members.length,
        },
        requirements_by_status: requirementsByStatus,
        risks_by_status: risksByStatus,
        hours_by_phase: hoursByPhase,
        hours_by_member: hoursByMember,
        hours_by_requirement: hoursByRequirement,
        general_hours: generalHours,
      });
    } catch (error) {
      console.error("Get reports error:", error);

      res.status(500).json({
        error: "Unable to generate project reports",
      });
    }
  },
);

export default router;
