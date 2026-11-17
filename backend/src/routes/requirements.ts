import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const validTypes = ["functional", "non_functional"];
const validStatuses = [
  "proposed",
  "approved",
  "implemented",
  "verified",
  "rejected",
];

// GET /api/projects/:projectId/requirements
router.get(
  "/:projectId/requirements",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);

      const { data, error } = await req
        .supabase!.from("requirements")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Distinguish an empty project from an inaccessible one.
      const { data: project, error: projectError } = await req
        .supabase!.from("projects")
        .select("id")
        .eq("id", projectId)
        .maybeSingle();

      if (projectError) {
        res.status(400).json({
          error: projectError.message,
        });
        return;
      }

      if (!project) {
        res.status(404).json({
          error: "Project not found or access denied",
        });
        return;
      }

      res.status(200).json(data ?? []);
    } catch (err) {
      console.error("Get requirements error:", err);
      res.status(500).json({
        error: "Unable to retrieve requirements",
      });
    }
  },
);

// POST /api/projects/:projectId/requirements
router.post(
  "/:projectId/requirements",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const { title, description = "", requirement_type } = req.body ?? {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        res.status(400).json({
          error: "Requirement title is required (max 200 characters)",
        });
        return;
      }

      if (typeof description !== "string" || description.length > 10000) {
        res.status(400).json({
          error: "Invalid requirement description",
        });
        return;
      }

      if (!validTypes.includes(requirement_type)) {
        res.status(400).json({
          error: "Invalid requirement type",
        });
        return;
      }

      // Confirm the caller can create requirements.
      const { data: membership, error: membershipError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (membershipError) {
        res.status(400).json({
          error: membershipError.message,
        });
        return;
      }

      if (
        !membership ||
        !["owner", "admin", "member"].includes(membership.role)
      ) {
        res.status(403).json({
          error: "You cannot create requirements in this project",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("requirements")
        .insert({
          project_id: projectId,
          title: title.trim(),
          description,
          requirement_type,
          status: "proposed",
          created_by: req.userId!,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Create requirement error:", error);
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(201).json(data);
    } catch (err) {
      console.error("Create requirement error:", err);
      res.status(500).json({
        error: "Unable to create requirement",
      });
    }
  },
);

// PUT /api/projects/:projectId/requirements/:requirementId
router.put(
  "/:projectId/requirements/:requirementId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const requirementId = String(req.params.requirementId);

      const { title, description, requirement_type, status } = req.body ?? {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        res.status(400).json({
          error: "Title is required (max 200 characters)",
        });
        return;
      }

      if (typeof description !== "string" || description.length > 10000) {
        res.status(400).json({
          error: "Invalid description",
        });
        return;
      }

      if (!validTypes.includes(requirement_type)) {
        res.status(400).json({
          error: "Invalid requirement type",
        });
        return;
      }

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: "Invalid requirement status",
        });
        return;
      }

      // Check the authenticated user's project role.
      const { data: membership, error: membershipError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (membershipError) {
        res.status(400).json({
          error: membershipError.message,
        });
        return;
      }

      if (
        !membership ||
        !["owner", "admin", "member"].includes(membership.role)
      ) {
        res.status(403).json({
          error: "You cannot edit requirements in this project",
        });
        return;
      }

      // Scope the update to this specific project.
      const { data, error } = await req
        .supabase!.from("requirements")
        .update({
          title: title.trim(),
          description,
          requirement_type,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requirementId)
        .eq("project_id", projectId)
        .select("*")
        .maybeSingle();

      if (error) {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (!data) {
        res.status(404).json({
          error: "Requirement not found or update denied",
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Update requirement error:", error);

      res.status(500).json({
        error: "Unable to update requirement",
      });
    }
  },
);

// DELETE /api/projects/:projectId/requirements/:requirementId
router.delete(
  "/:projectId/requirements/:requirementId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const requirementId = String(req.params.requirementId);

      const { data: membership, error: membershipError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (membershipError) {
        res.status(400).json({
          error: membershipError.message,
        });
        return;
      }

      // Only owners and admins may delete requirements.
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        res.status(403).json({
          error: "Only owners and admins can delete requirements",
        });
        return;
      }

      const { data, error } = await req
        .supabase!.from("requirements")
        .delete()
        .eq("id", requirementId)
        .eq("project_id", projectId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Delete requirement error:", error);

        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (!data) {
        res.status(404).json({
          error: "Requirement not found or deletion denied",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete requirement error:", error);

      res.status(500).json({
        error: "Unable to delete requirement",
      });
    }
  },
);

export default router;
