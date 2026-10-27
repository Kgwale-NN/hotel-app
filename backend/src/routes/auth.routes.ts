import { Router } from "express";
import {
  startGoogleLogin,
  googleCallback,
  getCurrentUser,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", googleCallback);
authRouter.get("/me", getCurrentUser);

export default authRouter;