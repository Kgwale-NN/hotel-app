import { Router } from "express";
import { handlePaystackWebhook } from "../controllers/payments.controller";

const paymentsRouter = Router();

paymentsRouter.post("/webhook", handlePaystackWebhook);

export default paymentsRouter;