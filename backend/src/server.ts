import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { supabase } from "./lib/supabase.js";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth.js";
import projectRoutes from "./routes/projects.js";
import projectMemberRoutes from "./routes/projectMembers.js";
import requirementRoutes from "./routes/requirements.js";
import projectRiskRoutes from "./routes/projectRisks.js";
import effortEntryRoutes from "./routes/effortEntries.js";
import projectReportRoutes from "./routes/projectReports.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g., Postman or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("CORS blocked origin:", origin);
        callback(new Error("Origin not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

app.use(express.json());

app.use(express.json());

// Health check endpoint

app.get("/api/health/database", async (_req, res) => {
  try {
    const { error } = await supabase.from("projects").select("id").limit(1);

    if (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(200).json({
      status: "ok",
      message: "Supabase API connection successful",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Unable to connect to Supabase",
    });
  }
});

app.get(
  "/api/auth/validate",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await req
        .supabase!.from("profiles")
        .select("id, display_name, created_at")
        .eq("id", req.userId!)
        .single();

      if (error) {
        return res.status(500).json({
          error: error.message,
        });
      }

      return res.json({
        userId: req.userId,
        profile: data,
      });
    } catch {
      return res.status(500).json({
        error: "Unable to retrieve user profile",
      });
    }
  },
);

app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMemberRoutes);
app.use("/api/projects", requirementRoutes);
app.use("/api/projects", projectRiskRoutes);
app.use("/api/projects", effortEntryRoutes);
app.use("/api/projects", projectReportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`SPMS backend running at http://localhost:${PORT}`);
});
