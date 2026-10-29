import { Router } from "express";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/", getMyNotifications);
notificationsRouter.patch("/read-all", requireCsrf, markAllNotificationsRead);
notificationsRouter.patch("/:notificationId/read", requireCsrf, markNotificationRead);

export default notificationsRouter;
