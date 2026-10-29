import express from "express";
import healthRouter from "./routes/health.routes";
import accommodationsRouter from "./routes/accommodations.routes";
import authRouter from "./routes/auth.routes";
import { sessionMiddleware } from "./config/session";
import profileRouter from "./routes/profile.routes";
import adminRouter from "./routes/admin.routes";
import bookingsRouter from "./routes/bookings.routes";
import favouritesRouter from "./routes/favourites.routes";
import reviewsRouter from "./routes/reviews.routes";
import notificationsRouter from "./routes/notifications.routes";
import paymentsRouter from "./routes/payments.routes";

const app = express();
app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = buffer;
    },
  })
);

app.use(sessionMiddleware);

app.use("/api/health", healthRouter);
app.use("/api/accommodations", accommodationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin", adminRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/favourites", favouritesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/payments", paymentsRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

export default app;
