import { Router } from "express";
import { getCurrentUser } from "../controllers/auth.controller";
import { updateProfile } from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const profileRouter = Router();

profileRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

profileRouter.use(requireAuth);

profileRouter.get("/", getCurrentUser);
profileRouter.patch("/", requireCsrf, updateProfile);

export default profileRouter;