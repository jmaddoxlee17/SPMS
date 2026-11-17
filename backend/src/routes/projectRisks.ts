import { Router, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const validLevels = ["low", "medium", "high"];
const validStatuses = ["identified", "mitigating", "resolved", "accepted"];

const canWrite = (role?: string): boolean =>
  ["owner", "admin", "member"].includes(role ?? "");

const canDelete = (role?: string): boolean =>
  ["owner", "admin"].includes(role ?? "");

const getMemberRole = async (
  req: AuthenticatedRequest,
  projectId: string,
): Promise<string | null> => {
  const { data, error } = await req
    .supabase!.from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", req.userId!)
    .maybeSingle();

  if (error) throw error;
  return data?.role ?? null;
};

// GET all project risks
router.get(
  "/:projectId/risks",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);

      const { data: project, error: projectError } = await req
        .supabase!.from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) throw projectError;

      if (!project) {
        res.status(404).json({
          error: "Project not found or access denied",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("project_risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.status(200).json(data ?? []);
    } catch (error) {
      console.error("Get project risks error:", error);
      res.status(500).json({
        error: "Unable to retrieve project risks",
      });
    }
  },
);

// POST create project risk
router.post(
  "/:projectId/risks",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);

      const { title, description, likelihood, impact, mitigation_plan } =
        req.body ?? {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        res.status(400).json({
          error: "Risk title is required (max 200 characters)",
        });
        return;
      }

      if (
        typeof description !== "string" ||
        typeof mitigation_plan !== "string" ||
        description.length > 10000 ||
        mitigation_plan.length > 10000 ||
        !validLevels.includes(likelihood) ||
        !validLevels.includes(impact)
      ) {
        res.status(400).json({
          error: "Invalid risk information",
        });
        return;
      }

      const role = await getMemberRole(req, projectId);

      if (!canWrite(role ?? undefined)) {
        res.status(403).json({
          error: "You cannot create project risks",
        });
        return;
      }

      const riskId = randomUUID();

      // Insert without .select() to avoid requiring
      // insert-returning permissions during the mutation.
      const { error: insertError } = await req
        .supabase!.from("project_risks")
        .insert({
          id: riskId,
          project_id: projectId,
          title: title.trim(),
          description,
          likelihood,
          impact,
          mitigation_plan,
          status: "identified",
          created_by: req.userId!,
        });

      if (insertError) throw insertError;

      const { data, error } = await req
        .supabase!.from("project_risks")
        .select("*")
        .eq("id", riskId)
        .eq("project_id", projectId)
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error("Create project risk error:", error);
      res.status(400).json({
        error: "Unable to create project risk",
      });
    }
  },
);

// PUT update project risk
router.put(
  "/:projectId/risks/:riskId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const riskId = String(req.params.riskId);

      const {
        title,
        description,
        likelihood,
        impact,
        mitigation_plan,
        status,
      } = req.body ?? {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200 ||
        typeof description !== "string" ||
        typeof mitigation_plan !== "string" ||
        description.length > 10000 ||
        mitigation_plan.length > 10000 ||
        !validLevels.includes(likelihood) ||
        !validLevels.includes(impact) ||
        !validStatuses.includes(status)
      ) {
        res.status(400).json({
          error: "Invalid risk information",
        });
        return;
      }

      const role = await getMemberRole(req, projectId);

      if (!canWrite(role ?? undefined)) {
        res.status(403).json({
          error: "You cannot update project risks",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("project_risks")
        .update({
          title: title.trim(),
          description,
          likelihood,
          impact,
          mitigation_plan,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", riskId)
        .eq("project_id", projectId)
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        res.status(404).json({
          error: "Risk not found or update denied",
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Update project risk error:", error);
      res.status(400).json({
        error: "Unable to update project risk",
      });
    }
  },
);

// DELETE project risk
router.delete(
  "/:projectId/risks/:riskId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const riskId = String(req.params.riskId);

      const role = await getMemberRole(req, projectId);

      if (!canDelete(role ?? undefined)) {
        res.status(403).json({
          error: "Only owners and admins can delete risks",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("project_risks")
        .delete()
        .eq("id", riskId)
        .eq("project_id", projectId)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        res.status(404).json({
          error: "Risk not found or deletion denied",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete project risk error:", error);
      res.status(400).json({
        error: "Unable to delete project risk",
      });
    }
  },
);

export default router;
