import { receiveRoomPhoto } from '../middleware/room-photo.middleware';
import { uploadRoomPhoto, updateRoomPhoto, deleteRoomPhoto } from '../controllers/room-photos.controller';
import { completeAdminBooking } from '../controllers/booking-completion.controller';
import { getAdminHotels, getAdminAccommodationDetail } from '../controllers/admin-inventory.controller';
import { Router } from "express";
import {
  getAdminAccommodations,
  createAccommodation,
  createRoom,
  updateAccommodation,
  deleteAccommodation,
  getAdminBookings,
  updateRoom,
  getAccommodationImages,
  addAccommodationImage,
  getAmenities,
  replaceAccommodationAmenities,
  updateAdminBookingStatus,
  updateAdminBookingDetails,
  sendPromotionNotification

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

adminRouter.get("/hotels", getAdminHotels);
adminRouter.get("/accommodations/:id", getAdminAccommodationDetail);
adminRouter.get("/accommodations", getAdminAccommodations);
adminRouter.get("/bookings", getAdminBookings);
adminRouter.post("/bookings/:bookingId/complete", requireCsrf, completeAdminBooking);
adminRouter.post(
  "/promotions",
  requireCsrf,
  sendPromotionNotification
);
adminRouter.patch("/bookings/:bookingId", requireCsrf, updateAdminBookingStatus);
adminRouter.patch(
  "/bookings/:bookingId/details",
  requireCsrf,
  updateAdminBookingDetails
);
adminRouter.get("/amenities", getAmenities);
adminRouter.post(
  "/accommodations",
  requireCsrf,
  createAccommodation
);

adminRouter.post(
  "/accommodations/:id/rooms",
  requireCsrf,
  createRoom
);

adminRouter.patch("/rooms/:roomId", requireCsrf, updateRoom);
adminRouter.get("/accommodations/:id/images", getAccommodationImages);
adminRouter.post("/accommodations/:id/images", requireCsrf, addAccommodationImage);
adminRouter.delete("/images/:imageId", requireCsrf, deleteRoomPhoto);
adminRouter.patch("/images/:imageId", requireCsrf, updateRoomPhoto);
adminRouter.post("/accommodations/:id/images/upload", requireCsrf, receiveRoomPhoto, uploadRoomPhoto);
adminRouter.put(
  "/accommodations/:id/amenities",
  requireCsrf,
  replaceAccommodationAmenities
);

adminRouter.patch(
  "/accommodations/:id",
  requireCsrf,
  updateAccommodation
);


adminRouter.delete(
  "/accommodations/:id",
  requireCsrf,
  deleteAccommodation
);

export default adminRouter;
