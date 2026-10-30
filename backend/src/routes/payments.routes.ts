import { Router } from "express";
import {
  handlePaystackWebhook,
  verifyBookingPayment,
} from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const paymentsRouter = Router();

paymentsRouter.post("/webhook", handlePaystackWebhook);
paymentsRouter.post(
  "/verify",
  requireAuth,
  requireCsrf,
  verifyBookingPayment
);

export default paymentsRouter;