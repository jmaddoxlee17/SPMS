import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/projects/:projectId/members
// Retrieve the members assigned to a project.
router.get(
  "/:projectId/members",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);

      const { data, error } = await req
        .supabase!.from("project_members")
        .select(
          `
          project_id,
          user_id,
          role,
          joined_at,
          profiles (
            id,
            display_name
          )
        `,
        )
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Get project members error:", error);

        res.status(400).json({
          error: error.message,
        });
        return;
      }

      const { data: memberEmails, error: emailError } = await req.supabase!.rpc(
        "get_project_member_emails",
        {
          p_project_id: projectId,
        },
      );

      if (emailError) {
        console.error("Member email lookup error:", emailError);

        res.status(400).json({
          error: "Unable to load team member emails",
        });
        return;
      }

      const emailsByUserId = new Map<string, string>();

      for (const member of memberEmails ?? []) {
        emailsByUserId.set(member.user_id, member.email ?? "");
      }

      const membersWithEmail = (data ?? []).map((member) => ({
        ...member,
        email: emailsByUserId.get(member.user_id) ?? "",
      }));

      res.status(200).json(membersWithEmail);
    } catch (error) {
      console.error("Unexpected members error:", error);

      res.status(500).json({
        error: "Unable to retrieve project members",
      });
    }
  },
);

// POST /api/projects/:projectId/members

/**
 * POST /api/projects/:projectId/members
 * Add an existing SPMS user by email address.
 */
router.post(
  "/:projectId/members",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const { email, role } = req.body ?? {};

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      // Validate project ID
      if (!uuidPattern.test(projectId)) {
        res.status(400).json({
          error: "Invalid project ID",
        });
        return;
      }

      // Validate email address
      if (
        typeof email !== "string" ||
        email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        res.status(400).json({
          error: "A valid email address is required",
        });
        return;
      }

      // Restrict assignable roles
      if (role !== "member" && role !== "viewer") {
        res.status(400).json({
          error: "Role must be Member or Viewer",
        });
        return;
      }

      // Verify current user's project permissions
      const { data: caller, error: callerError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (callerError) {
        res.status(400).json({
          error: callerError.message,
        });
        return;
      }

      if (!caller || !["owner", "admin"].includes(caller.role)) {
        res.status(403).json({
          error: "Only owners and admins can add team members",
        });
        return;
      }

      // Resolve email and insert member securely.
      // The database function independently checks permissions.
      const { data: added, error: rpcError } = await req.supabase!.rpc(
        "add_project_member_by_email",
        {
          p_project_id: projectId,
          p_email: email.trim(),
          p_role: role,
        },
      );

      if (rpcError) {
        console.error("Add member RPC error:", rpcError);

        res.status(400).json({
          error: "Unable to add team member",
        });
        return;
      }

      if (added !== true) {
        res.status(400).json({
          error:
            "Unable to add member. Verify the account exists and is not already a member.",
        });
        return;
      }

      res.status(201).json({
        message: "Team member added successfully",
      });
    } catch (error) {
      console.error("Unexpected add member error:", error);

      res.status(500).json({
        error: "Unable to add team member",
      });
    }
  },
);

// PATCH /api/projects/:projectId/members/:userId
// Change an existing member's role.
router.patch(
  "/:projectId/members/:userId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = String(req.params.userId);
      const { role } = req.body ?? {};

      if (role !== "member" && role !== "viewer") {
        res.status(400).json({
          error: "Role must be member or viewer",
        });
        return;
      }

      // Verify caller's permission
      const { data: caller, error: callerError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (callerError) {
        res.status(400).json({ error: callerError.message });
        return;
      }

      if (!caller || !["owner", "admin"].includes(caller.role)) {
        res.status(403).json({
          error: "You do not have permission to manage this team",
        });
        return;
      }

      // Verify target membership
      const { data: target, error: targetError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError) {
        res.status(400).json({ error: targetError.message });
        return;
      }

      if (!target) {
        res.status(404).json({
          error: "Team member not found",
        });
        return;
      }

      if (!["member", "viewer"].includes(target.role)) {
        res.status(403).json({
          error: "Owner and admin roles cannot be changed",
        });
        return;
      }

      const { data: updated, error: updateError } = await req
        .supabase!.from("project_members")
        .update({ role })
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .in("role", ["member", "viewer"])
        .select("project_id, user_id, role, joined_at")
        .maybeSingle();

      if (updateError) {
        res.status(400).json({ error: updateError.message });
        return;
      }

      if (!updated) {
        res.status(403).json({
          error: "Membership was not updated",
        });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error("Update membership error:", error);
      res.status(500).json({
        error: "Unable to update team member",
      });
    }
  },
);

// DELETE /api/projects/:projectId/members/:userId
// Remove an existing member or viewer.
router.delete(
  "/:projectId/members/:userId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = String(req.params.userId);

      const { data: caller, error: callerError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (callerError) {
        res.status(400).json({ error: callerError.message });
        return;
      }

      if (!caller || !["owner", "admin"].includes(caller.role)) {
        res.status(403).json({
          error: "You do not have permission to remove members",
        });
        return;
      }

      const { data: target, error: targetError } = await req
        .supabase!.from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

      if (targetError) {
        res.status(400).json({ error: targetError.message });
        return;
      }

      if (!target) {
        res.status(404).json({
          error: "Team member not found",
        });
        return;
      }

      if (!["member", "viewer"].includes(target.role)) {
        res.status(403).json({
          error: "Owner and admin accounts cannot be removed",
        });
        return;
      }

      const { data: deleted, error: deleteError } = await req
        .supabase!.from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .in("role", ["member", "viewer"])
        .select("user_id")
        .maybeSingle();

      if (deleteError) {
        res.status(400).json({ error: deleteError.message });
        return;
      }

      if (!deleted) {
        res.status(403).json({
          error: "Membership was not removed",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Remove membership error:", error);
      res.status(500).json({
        error: "Unable to remove team member",
      });
    }
  },
);

export default router;
