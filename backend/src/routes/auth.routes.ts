import { Router } from "express";
import {
  startGoogleLogin,
  googleCallback,
  getCurrentUser,
  getCsrfToken,
  logout,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware"

const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", googleCallback);

authRouter.get("/me", requireAuth, getCurrentUser);
authRouter.get("/csrf", requireAuth, getCsrfToken);
authRouter.post("/logout", requireAuth, requireCsrf, logout);

export default authRouter;