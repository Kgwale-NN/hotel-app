import { Router } from "express";
import {
  getAdminAccommodations,
  createAccommodation,
} from "../controllers/admin.controller";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const adminRouter = Router();

adminRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get("/accommodations", getAdminAccommodations);
adminRouter.post(
  "/accommodations",
  requireCsrf,
  createAccommodation
);

export default adminRouter;