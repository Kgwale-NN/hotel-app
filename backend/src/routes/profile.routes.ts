import { Router } from "express";
import { getCurrentUser } from "../controllers/auth.controller";
import { updateProfile , updateMarketingPreference} from "../controllers/profile.controller";
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

profileRouter.patch(
  "/marketing-preference",
  requireCsrf,
  updateMarketingPreference
);

export default profileRouter;