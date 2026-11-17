import { randomUUID } from "node:crypto";
import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/projects
// Retrieve all projects accessible to the authenticated user.
router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await req
        .supabase!.from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Get projects error:", error);

        res.status(500).json({
          error: error.message,
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Unexpected get projects error:", error);

      res.status(500).json({
        error: "Unable to retrieve projects",
      });
    }
  },
);

// POST /api/projects
// Create a project and automatically assign the creator as owner.
router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description } = req.body ?? {};

      // Validate project name
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({
          error: "Project name is required",
        });
        return;
      }

      // Validate description
      if (description !== undefined && typeof description !== "string") {
        res.status(400).json({
          error: "Description must be a string",
        });
        return;
      }

      // Generate project ID
      const projectId = randomUUID();

      // Step 1: Insert project
      // Do not chain .select() here because of RLS.
      const { error: insertError } = await req
        .supabase!.from("projects")
        .insert({
          id: projectId,
          name: name.trim(),
          description: description ?? "",
          project_manager_id: req.userId!,
          status: "active",
        });

      if (insertError) {
        console.error("Create project error:", insertError);

        res.status(400).json({
          error: insertError.message,
        });
        return;
      }

      // Step 2: Retrieve the newly created project
      const { data: project, error: selectError } = await req
        .supabase!.from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (selectError || !project) {
        console.error(
          "Created project but failed to retrieve it:",
          selectError,
        );

        res.status(201).json({
          id: projectId,
          message:
            "Project created successfully, but details could not be retrieved",
        });
        return;
      }

      // Step 3: Return the created project
      res.status(201).json(project);
    } catch (error) {
      console.error("Unexpected create project error:", error);

      res.status(500).json({
        error: "Unable to create project",
      });
    }
  },
);

/**
 * GET /api/projects/:id
 * Retrieve a single project by ID.
 */
router.get(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.id);

      const { data, error } = await req
        .supabase!.from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (!data) {
        res.status(404).json({
          error: "Project not found",
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({
        error: "Unable to retrieve project",
      });
    }
  },
);

/**
 * PUT /api/projects/:id
 * Update project information.
 * RLS limits updates to owners and admins.
 */
router.put(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.id);
      const { name, description, status } = req.body ?? {};

      const updates: Record<string, string> = {};

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          res.status(400).json({
            error: "Valid project name is required",
          });
          return;
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        if (typeof description !== "string") {
          res.status(400).json({
            error: "Description must be a string",
          });
          return;
        }
        updates.description = description;
      }

      if (status !== undefined) {
        const allowedStatuses = ["planning", "active", "on_hold", "completed"];

        if (!allowedStatuses.includes(status)) {
          res.status(400).json({
            error: "Invalid project status",
          });
          return;
        }

        updates.status = status;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          error: "No valid fields provided for update",
        });
        return;
      }

      // UPDATE without returning rows, consistent with
      // our project-creation approach.
      const { error: updateError } = await req
        .supabase!.from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updateError) {
        res.status(400).json({
          error: updateError.message,
        });
        return;
      }

      const { data, error: selectError } = await req
        .supabase!.from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (selectError) {
        res.status(500).json({
          error: selectError.message,
        });
        return;
      }

      if (!data) {
        res.status(404).json({
          error: "Project not found or access denied",
        });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({
        error: "Unable to update project",
      });
    }
  },
);

/**
 * DELETE /api/projects/:id
 * Delete a project.
 * RLS permits owners only.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.id);

      const { error } = await req
        .supabase!.from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({
        error: "Unable to delete project",
      });
    }
  },
);

export default router;
