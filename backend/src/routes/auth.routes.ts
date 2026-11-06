import { rateLimit } from 'express-rate-limit';
import { registerWithPassword, loginWithPassword } from '../controllers/password-auth.controller';
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
const passwordAuthLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many account attempts. Please try again in 15 minutes.' },
});

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

authRouter.get('/form-token', passwordAuthLimit, getCsrfToken);
authRouter.post('/register', passwordAuthLimit, requireCsrf, registerWithPassword);
authRouter.post('/login', passwordAuthLimit, requireCsrf, loginWithPassword);
authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", googleCallback);

authRouter.get("/me", requireAuth, getCurrentUser);
authRouter.get("/csrf", requireAuth, getCsrfToken);
authRouter.post("/logout", requireAuth, requireCsrf, logout);

export default authRouter;