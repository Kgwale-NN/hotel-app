import { Router } from "express";
import { getAdminAccommodations } from "../controllers/admin.controller";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.middleware";

const adminRouter = Router();

adminRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

adminRouter.get("/accommodations", getAdminAccommodations);

export default adminRouter;