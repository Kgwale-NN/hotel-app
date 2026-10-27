import { Router } from "express";
import {
  startGoogleLogin,
  googleCallback,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", googleCallback);

export default authRouter;