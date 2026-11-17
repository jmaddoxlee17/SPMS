import { Router, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const validCategories = [
  "requirement_analysis",
  "design",
  "coding",
  "testing",
  "project_management",
];

const validPeriods = ["daily", "weekly"];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const canWrite = (role?: string | null): boolean =>
  ["owner", "admin", "member"].includes(role ?? "");

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

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const parseEntry = (body: any) => {
  const { period_type, period_start, category, requirement_id, hours, notes } =
    body ?? {};

  if (!validPeriods.includes(period_type)) {
    return { error: "Invalid reporting period" };
  }

  if (!isValidDate(period_start)) {
    return { error: "A valid date is required" };
  }

  if (
    period_type === "weekly" &&
    new Date(`${period_start}T00:00:00Z`).getUTCDay() !== 1
  ) {
    return {
      error: "Weekly reporting periods must start on Monday",
    };
  }

  if (!validCategories.includes(category)) {
    return { error: "Invalid development phase" };
  }

  if (
    typeof hours !== "number" ||
    !Number.isFinite(hours) ||
    hours <= 0 ||
    hours > (period_type === "daily" ? 24 : 168) ||
    Math.abs(hours * 100 - Math.round(hours * 100)) > 0.000001
  ) {
    return {
      error:
        "Hours must be positive, have at most two decimal places, and fit the reporting period",
    };
  }

  if (typeof notes !== "string" || notes.length > 5000) {
    return { error: "Invalid work notes" };
  }

  const requirementId =
    requirement_id === "" || requirement_id == null ? null : requirement_id;

  if (
    requirementId !== null &&
    (typeof requirementId !== "string" || !uuidPattern.test(requirementId))
  ) {
    return { error: "Invalid requirement ID" };
  }

  return {
    value: {
      period_type,
      period_start,
      category,
      requirement_id: requirementId,
      hours,
      notes: notes.trim(),
    },
  };
};

const verifyRequirement = async (
  req: AuthenticatedRequest,
  projectId: string,
  requirementId: string | null,
): Promise<boolean> => {
  if (!requirementId) return true;

  const { data, error } = await req
    .supabase!.from("requirements")
    .select("id")
    .eq("id", requirementId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
};

// GET /api/projects/:projectId/effort
router.get(
  "/:projectId/effort",
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
        .supabase!.from("effort_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("period_start", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.status(200).json(data ?? []);
    } catch (error) {
      console.error("Get effort error:", error);
      res.status(500).json({
        error: "Unable to retrieve effort entries",
      });
    }
  },
);

// POST /api/projects/:projectId/effort
router.post(
  "/:projectId/effort",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const parsed = parseEntry(req.body);

      if (!parsed.value) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const role = await getMemberRole(req, projectId);

      if (!canWrite(role)) {
        res.status(403).json({
          error: "You cannot log effort for this project",
        });
        return;
      }

      if (
        !(await verifyRequirement(req, projectId, parsed.value.requirement_id))
      ) {
        res.status(400).json({
          error: "Requirement does not belong to this project",
        });
        return;
      }

      const entryId = randomUUID();

      const { error: insertError } = await req
        .supabase!.from("effort_entries")
        .insert({
          id: entryId,
          project_id: projectId,
          user_id: req.userId!,
          ...parsed.value,
        });

      if (insertError) throw insertError;

      const { data, error } = await req
        .supabase!.from("effort_entries")
        .select("*")
        .eq("id", entryId)
        .eq("project_id", projectId)
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error) {
      console.error("Create effort error:", error);
      res.status(400).json({
        error: "Unable to create effort entry",
      });
    }
  },
);

// PUT /api/projects/:projectId/effort/:entryId
router.put(
  "/:projectId/effort/:entryId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const entryId = String(req.params.entryId);
      const parsed = parseEntry(req.body);

      if (!parsed.value) {
        res.status(400).json({ error: parsed.error });
        return;
      }

      const role = await getMemberRole(req, projectId);

      if (!canWrite(role)) {
        res.status(403).json({
          error: "You cannot edit effort entries",
        });
        return;
      }

      if (
        !(await verifyRequirement(req, projectId, parsed.value.requirement_id))
      ) {
        res.status(400).json({
          error: "Requirement does not belong to this project",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("effort_entries")
        .update({
          ...parsed.value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId)
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        res.status(404).json({
          error: "Entry not found or editing not permitted",
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Update effort error:", error);
      res.status(400).json({
        error: "Unable to update effort entry",
      });
    }
  },
);

// DELETE /api/projects/:projectId/effort/:entryId
router.delete(
  "/:projectId/effort/:entryId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const entryId = String(req.params.entryId);

      const role = await getMemberRole(req, projectId);

      if (!canWrite(role)) {
        res.status(403).json({
          error: "You cannot delete effort entries",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("effort_entries")
        .delete()
        .eq("id", entryId)
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        res.status(404).json({
          error: "Entry not found or deletion not permitted",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete effort error:", error);
      res.status(400).json({
        error: "Unable to delete effort entry",
      });
    }
  },
);

export default router;
