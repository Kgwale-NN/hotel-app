import { Router } from "express";
import {
  cancelMyBooking,
  createBooking,
  getAccommodationAvailability,
  getMyBookingById,
  getMyBookings,
} from "../controllers/bookings.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";
import { initializeBookingPayment } from "../controllers/payments.controller";

const bookingsRouter = Router();

bookingsRouter.get("/availability", getAccommodationAvailability);
bookingsRouter.get("/", requireAuth, getMyBookings);
bookingsRouter.post("/", requireAuth, requireCsrf, createBooking);
bookingsRouter.post(
  "/:id/payments",
  requireAuth,
  requireCsrf,
  initializeBookingPayment
);
bookingsRouter.get("/:id", requireAuth, getMyBookingById);
bookingsRouter.post("/:id/cancel", requireAuth, requireCsrf, cancelMyBooking);

export default bookingsRouter;
