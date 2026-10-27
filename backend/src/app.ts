import express from "express";
import healthRouter from "./routes/health.routes";
import accommodationsRouter from "./routes/accommodations.routes";
import authRouter from "./routes/auth.routes";
import { sessionMiddleware } from "./config/session";
import profileRouter from "./routes/profile.routes";
import adminRouter from "./routes/admin.routes";

const app = express();

app.use(express.json());
app.use(sessionMiddleware);

app.use("/api/health", healthRouter);
app.use("/api/accommodations", accommodationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin", adminRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

export default app;