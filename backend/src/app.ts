import express from "express";
import healthRouter from "./routes/health.routes";

const app = express();

app.use(express.json());

app.use("/api/health", healthRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

export default app;